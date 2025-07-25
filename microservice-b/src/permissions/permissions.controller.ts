import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '@arkham/auth';
import { PermissionsRoute } from './permissions.routes';
import { PermissionsCheckRequestDto } from './dto/permissions-check-request.dto';
import { PermissionsCheckResponseDto } from './dto/permissions-check-response.dto';
import { AuthenticatedRequest } from '../auth/types/auth.types';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ApiOperation({ summary: 'Check user permissions for tables' })
  @ApiResponse({
    status: 200,
    description: 'Permissions check completed successfully',
    type: PermissionsCheckResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication token missing or invalid',
  })
  @ApiBearerAuth()
  @Post(PermissionsRoute.CHECK)
  @UseGuards(JwtAuthGuard)
  check(
    @Request() req: AuthenticatedRequest,
    @Body() dto: PermissionsCheckRequestDto,
  ): Promise<PermissionsCheckResponseDto> {
    return this.permissionsService.checkAccess(req.user.userId, dto.tables);
  }
}
