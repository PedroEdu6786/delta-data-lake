import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({
    type: 'string',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    type: 'string',
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;
}
