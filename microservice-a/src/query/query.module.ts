import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { AthenaQueryEngineService } from './engines/athena-query-engine/athena-query-engine.service';
import { QUERY_ENGINE } from './types/query-engine.interface';
import { SqlParserService } from '../sql-parser/sql-parser.service';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { AwsClientFactory } from './engines/athena-query-engine/factories/aws-client.factory';
import { TableValidatorService } from './engines/athena-query-engine/services/table-validator.service';
import { AthenaErrorHandlerService } from './engines/athena-query-engine/services/athena-error-handler.service';

@Module({
  imports: [PermissionsModule],
  controllers: [QueryController],
  providers: [
    QueryService,
    SqlParserService,
    AwsClientFactory,
    AthenaErrorHandlerService,
    {
      provide: TableValidatorService,
      useFactory: (awsClientFactory: AwsClientFactory) => {
        return new TableValidatorService(awsClientFactory.createGlueClient());
      },
      inject: [AwsClientFactory],
    },
    AthenaQueryEngineService,
    {
      provide: QUERY_ENGINE,
      useClass: AthenaQueryEngineService,
    },
  ],
  exports: [QueryService],
})
export class QueryModule {}
