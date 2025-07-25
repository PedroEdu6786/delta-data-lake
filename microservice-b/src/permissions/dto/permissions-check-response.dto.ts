import { ApiProperty } from '@nestjs/swagger';

export class PermissionsCheckResponseDto {
  @ApiProperty({
    type: 'boolean',
    description: 'Whether access is allowed to all requested tables',
    example: true,
  })
  allowed: boolean;

  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    description: 'List of table names that access was denied to',
    example: ['orders', 'users'],
  })
  deniedTables: string[];
}
