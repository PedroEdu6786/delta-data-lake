import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationRequestDto } from 'src/commons/dto/pagination-request.dto';

export class QueryRequestDto extends PaginationRequestDto {
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  q: string;
}
