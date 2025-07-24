import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { getErrorMessage, isError } from 'src/commons/helpers';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class GenericHttpClient {
  private readonly logger = new Logger(GenericHttpClient.name);
  private readonly requestTimeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly baseUrl: string,
    requestTimeout: number = 5000,
  ) {
    this.requestTimeout = requestTimeout;
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
        `Request to ${endpoint} failed: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }
}
