import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { QueryService } from './query.service';
import { AuditorRoute } from './query.routes';
import { JwtAuthGuard } from '@arkham/auth';
import { AuthToken } from 'src/commons/decorators/auth-token.decorator';
import { QueryRequestDto } from './dto/query-request.dto';
import { StreamingResponseInterceptor } from 'src/commons/interceptors/streaming-response.interceptor';
import { StreamingJsonArray } from 'src/commons/decorators/streaming-json-array.decorator';

@Controller('query')
@UseInterceptors(StreamingResponseInterceptor)
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Get(AuditorRoute.QUERY)
  @UseGuards(JwtAuthGuard)
  @StreamingJsonArray()
  async executeQuery(
    @AuthToken() token: string,
    @Query() requestDto: QueryRequestDto,
  ) {
    return this.queryService.runQuery(
      token,
      requestDto.q,
      requestDto.page,
      requestDto.limit,
    );
  }
}
