import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRoute } from './auth.routes';
import { JwtAuthGuard } from '@arkham/auth';
import { AuthenticatedRequest } from './types/auth.types';
import { LoginRequestDto } from './dto/login-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post(AuthRoute.LOGIN)
  async login(@Body() loginDto: LoginRequestDto) {
    const { email, password } = loginDto;
    return this.authService.authenticateAndLogin(email, password);
  }

  @UseGuards(JwtAuthGuard)
  @Get(AuthRoute.PROTECTED)
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }
}
