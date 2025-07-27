import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  ArrayNotEmpty,
  ArrayMaxSize,
} from 'class-validator';

export class PermissionsCheckRequestDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    description: 'List of table names to check access for',
    example: ['users', 'orders'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  tables: string[];
}
