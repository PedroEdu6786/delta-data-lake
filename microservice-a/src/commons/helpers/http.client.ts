import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError, retry, timer } from 'rxjs';
import { getErrorMessage, isError } from 'src/commons/helpers';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class GenericHttpClient {
  private readonly logger = new Logger(GenericHttpClient.name);
  private readonly requestTimeout: number;
  private readonly maxRetries: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly baseUrl: string,
    requestTimeout: number = 5000,
    maxRetries: number = 3,
  ) {
    this.requestTimeout = requestTimeout;
    this.maxRetries = maxRetries;
  }

  async post<T>(
    endpoint: string,
    data: any,
    config?: AxiosRequestConfig<any>,
  ): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .post<T>(`${this.baseUrl}${endpoint}`, data, config)
          .pipe(
            timeout(this.requestTimeout),
            retry({
              count: this.maxRetries,
              delay: (error, retryCount) => {
                const delay = Math.min(
                  1000 * Math.pow(2, retryCount - 1),
                  10000,
                );
                this.logger.warn(
                  `Retrying request to ${endpoint} (attempt ${retryCount}/${this.maxRetries}) after ${delay}ms`,
                  {
                    error: getErrorMessage(error),
                  },
                );
                return timer(delay);
              },
            }),
            catchError((error) => {
              if (isError(error)) {
                this.logger.error(
                  `HTTP request failed: ${error.message}`,
                  error.stack,
                );
              }
              throw error;
            }),
          ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Request to ${endpoint} failed after ${this.maxRetries} retries: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }
}
