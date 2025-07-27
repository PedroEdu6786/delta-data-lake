import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  firstValueFrom,
  timeout,
  catchError,
  retry,
  timer,
  Observable,
} from 'rxjs';
import { getErrorMessage, isError } from 'src/commons/helpers';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

interface HttpClientConfig {
  baseUrl: string;
  requestTimeout?: number;
  maxRetries?: number;
}

@Injectable()
export class GenericHttpClient {
  private readonly logger = new Logger(GenericHttpClient.name);
  private readonly config: Required<HttpClientConfig>;

  constructor(
    private readonly httpService: HttpService,
    config: HttpClientConfig,
  ) {
    this.config = {
      baseUrl: config.baseUrl,
      requestTimeout: config.requestTimeout ?? 5000,
      maxRetries: config.maxRetries ?? 3,
    };
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.executeRequest(
      () => this.httpService.get<T>(this.buildUrl(endpoint), config),
      endpoint,
    );
  }

  async post<T>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.executeRequest(
      () => this.httpService.post<T>(this.buildUrl(endpoint), data, config),
      endpoint,
    );
  }

  private async executeRequest<T>(
    requestFn: () => Observable<AxiosResponse<T>>,
    endpoint: string,
  ): Promise<T> {
    try {
      const response = await firstValueFrom(
        requestFn().pipe(
          timeout(this.config.requestTimeout),
          retry(this.createRetryConfig(endpoint)),
          catchError(this.handleError()),
        ),
      );

      return response.data;
    } catch (error) {
      this.logFinalError(endpoint, error);
      throw error;
    }
  }

  private buildUrl(endpoint: string): string {
    return `${this.config.baseUrl}${endpoint}`;
  }

  private createRetryConfig(endpoint: string) {
    return {
      count: this.config.maxRetries,
      delay: (error: unknown, retryCount: number) => {
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);

        this.logger.warn(
          `Retrying request to ${endpoint} (attempt ${retryCount}/${this.config.maxRetries}) after ${delay}ms`,
          { error: getErrorMessage(error) },
        );

        return timer(delay);
      },
    };
  }

  private handleError() {
    return (error: unknown) => {
      if (isError(error)) {
        this.logger.error(`HTTP request failed: ${error.message}`, error.stack);
      }
      throw error;
    };
  }

  private logFinalError(endpoint: string, error: unknown): void {
    this.logger.error(
      `Request to ${endpoint} failed after ${this.config.maxRetries} retries: ${getErrorMessage(error)}`,
    );
  }
}
