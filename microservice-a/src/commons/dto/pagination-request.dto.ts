import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import config from 'config';
import { IsPositiveInt } from '../decorators/is-positive-int.decorator';

/**
 *
 */
export class PaginationRequestDto {
  //   @ApiProperty({
  //     type: 'number',
  //     default: config.get('pagination.page'),
  //     description: 'Which page of data are you requesting',
  //     required: false,
  //     minimum: 1,
  //   })
  @IsOptional()
  @IsPositiveInt()
  @Transform(({ value }) => parseInt(value))
  page?: number = config.get('pagination.page');

  //   @ApiProperty({
  //     type: 'number',
  //     default: config.get('pagination.limit'),
  //     description: 'How many items are you requesting',
  //     required: false,
  //     minimum: 1,
  //     maximum: config.get('pagination.max'),
  //   })
  @IsOptional()
  @IsPositiveInt()
  @Transform(({ value }) => parseInt(value))
  limit?: number = config.get('pagination.limit');
}
