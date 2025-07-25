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
import { StreamingJsonArray } from 'src/commons/decorators/streaming-json-array.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StreamingResponseInterceptor } from 'src/commons/interceptors/streaming-response.interceptor';

@Controller('query')
@UseInterceptors(StreamingResponseInterceptor)
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @ApiOperation({ summary: 'Execute SQL query' })
  @ApiResponse({
    status: 200,
    description:
      'Query executed successfully, results returned as streaming JSON.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query syntax or parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication token missing or invalid.',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to one or more tables in the query.',
  })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during query execution.',
  })
  @ApiResponse({
    status: 503,
    description: 'Query engine temporarily unavailable.',
  })
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
