import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import config from 'config';
import { IsPositiveInt } from '../decorators/is-positive-int.decorator';
import { ApiProperty } from '@nestjs/swagger';

/**
 *
 */
export class PaginationRequestDto {
  @ApiProperty({
    type: 'number',
    description: 'Which page of data are you requesting',
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @IsPositiveInt()
  @Transform(({ value }) => parseInt(value))
  page?: number = config.get('pagination.page');

  @ApiProperty({
    type: 'number',
    description: 'How many items are you requesting',
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @IsPositiveInt()
  @Transform(({ value }) => parseInt(value))
  limit?: number = config.get('pagination.limit');
}
