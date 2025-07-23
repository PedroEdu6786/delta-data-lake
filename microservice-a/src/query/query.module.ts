import { Module } from '@nestjs/common';
import { QueryController } from './query.controller';

import { QueryService } from './query.service';
import { AthenaQueryEngineService } from './engines/athena-query-engine/athena-query-engine.service';
import { QUERY_ENGINE } from './types/query-engine.interface';
import { SqlParserService } from '../sql-parser/sql-parser.service';

@Module({
  imports: [],
  controllers: [QueryController],
  providers: [
    QueryService,
    SqlParserService,
    AthenaQueryEngineService,
    {
      provide: QUERY_ENGINE,
      useClass: AthenaQueryEngineService, // bind AthenaQueryEngine to the interface
    },
  ],
  exports: [QueryService],
})
export class QueryModule {}
