import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PermissionsCheckRequestDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    description: 'List of table names to check permissions for',
    example: ['users', 'products', 'orders'],
  })
  @IsArray()
  @IsString({ each: true })
  tables: string[];
}
