import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationRequestDto } from 'src/commons/dto/pagination-request.dto';
import { ApiProperty } from '@nestjs/swagger';

export class QueryRequestDto extends PaginationRequestDto {
  @ApiProperty({
    type: 'string',
    description: 'Query to execute',
    required: true,
  })
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  q: string;
}
