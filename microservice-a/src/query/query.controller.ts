import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryService } from './query.service';
import { AuditorRoute } from './query.routes';
import { JwtAuthGuard } from '@arkham/auth';
import { AuthToken } from 'src/commons/decorators/auth-token.decorator';
import { QueryRequestDto } from './dto/query-request.dto';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Get(AuditorRoute.QUERY)
  @UseGuards(JwtAuthGuard)
  async executeQuery(
    @AuthToken() token: string,
    @Query() requestDto: QueryRequestDto,
  ) {
    const result = await this.queryService.runQuery(
      token,
      requestDto.q,
      requestDto.page,
      requestDto.limit,
    );
    return { result };
  }
}
