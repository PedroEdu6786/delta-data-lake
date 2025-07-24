import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryService } from './query.service';
import { AuditorRoute } from './query.routes';
import { JwtAuthGuard } from '@arkham/auth';
import { AuthToken } from 'src/common/decorators/auth-token.decorator';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Get(AuditorRoute.QUERY)
  @UseGuards(JwtAuthGuard)
  async executeQuery(@AuthToken() token: string, @Query('q') sql: string) {
    const result = await this.queryService.runQuery(token, sql, 1, 1);
    return { result };
  }
}
