import { Controller, Get, Query } from '@nestjs/common';
import { QueryService } from './query.service';
import { AuditorRoute } from './query.routes';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Get(AuditorRoute.QUERY)
  async executeQuery(@Query('q') sql: string) {
    const result = await this.queryService.runQuery(sql, 1, 10);
    return { result };
  }
}
