import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { QueryModule } from './query/query.module';
import { AuthModule } from '@arkham/auth';
import { PermissionsModule } from './permissions/permissions.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { GlobalExceptionFilter } from './commons/filters/global-exception.filter';
import { LoggingInterceptor } from './commons/interceptors/logging.interceptor';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
            winston.format.printf((info: any) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              return `${info.timestamp} [${info.level}]: ${info.message}`;
            }),
          ),
        }),
      ],
    }),
    QueryModule,
    AuthModule,
    PermissionsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
