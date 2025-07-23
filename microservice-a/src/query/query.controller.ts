import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { QueryService } from './query.service';
import { AuditorRoute } from './query.routes';
import { JwtAuthGuard } from '@arkham/auth';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Get(AuditorRoute.QUERY)
  @UseGuards(JwtAuthGuard)
  async executeQuery(@Request() req: any, @Query('q') sql: string) {
    const result = await this.queryService.runQuery(sql, 1, 10);
    return { result };
  }
}
