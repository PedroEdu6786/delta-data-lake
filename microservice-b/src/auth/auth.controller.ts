import {
  Controller,
  Get,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRoute } from './auth.routes';
import { JwtAuthGuard } from '@arkham/auth';

interface User {
  userId: string;
  email: string;
}

interface AuthenticatedRequest {
  user: User; // replace with your actual User type
}

interface LoginRequest {
  body: {
    email: string;
    password: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post(AuthRoute.LOGIN)
  async login(@Request() req: LoginRequest) {
    const { email, password } = req.body;
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException();
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(AuthRoute.PROTECTED)
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }
}
