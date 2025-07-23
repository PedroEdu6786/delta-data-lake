import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '@arkham/auth';

interface User {
  userId: string;
  email: string;
}

interface AuthenticatedRequest {
  user: User; // replace with your actual User type
}

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post('check')
  @UseGuards(JwtAuthGuard)
  check(
    @Request() req: AuthenticatedRequest,
    @Body() dto: { tables: string[] },
  ) {
    return this.permissionsService.checkAccess(req.user.userId, dto.tables);
  }
}
