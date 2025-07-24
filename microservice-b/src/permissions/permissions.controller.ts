import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '@arkham/auth';
import { PermissionsRoute } from './permissions.routes';
import { PermissionsCheckRequestDto } from './dto/permissions-check-request.dto';
import { AuthenticatedRequest } from '../auth/types/auth.types';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post(PermissionsRoute.CHECK)
  @UseGuards(JwtAuthGuard)
  check(
    @Request() req: AuthenticatedRequest,
    @Body() dto: PermissionsCheckRequestDto,
  ) {
    return this.permissionsService.checkAccess(req.user.userId, dto.tables);
  }
}
