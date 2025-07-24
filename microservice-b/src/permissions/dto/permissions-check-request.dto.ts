import { IsArray, IsString } from 'class-validator';

export class PermissionsCheckRequestDto {
  @IsArray()
  @IsString({ each: true })
  tables: string[];
}
