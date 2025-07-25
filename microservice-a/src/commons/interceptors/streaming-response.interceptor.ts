import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { map } from 'rxjs/operators';
import { STREAMING_JSON_ARRAY_KEY } from '../decorators/streaming-json-array.decorator';

@Injectable()
export class StreamingResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const isStreaming = this.reflector.get<boolean>(
      STREAMING_JSON_ARRAY_KEY,
      context.getHandler(),
    );

    if (!isStreaming) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map(async (dataStream: AsyncGenerator<any, void>) => {
        const page =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          Number(context.switchToHttp().getRequest().query?.page) || 1;
        const limit =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          Number(context.switchToHttp().getRequest().query?.limit) || 50;

        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Transfer-Encoding', 'chunked');
        response.write('[');

        response.write(`{"page": ${page}, "limit": ${limit}, "data":[`);

        let isFirst = true;

        try {
          for await (const item of dataStream) {
            if (!isFirst) response.write(',');
            response.write(JSON.stringify(item));
            console.log('Sent row:', item);
            isFirst = false;
          }

          response.write(']}]');
          response.end();
        } catch (err) {
          response.write(']}]');
          response.end();
          throw err;
        }
      }),
    );
  }
}
