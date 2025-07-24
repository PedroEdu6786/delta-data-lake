import { applyDecorators } from '@nestjs/common';
import { IsInt, IsPositive, ValidationOptions } from 'class-validator';

export function IsPositiveInt(validationOptions?: ValidationOptions) {
  return applyDecorators(
    IsInt(validationOptions),
    IsPositive(validationOptions),
  );
}
