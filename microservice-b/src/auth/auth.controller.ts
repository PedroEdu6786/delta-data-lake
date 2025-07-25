import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthRoute } from './auth.routes';
import { JwtAuthGuard } from '@arkham/auth';
import { AuthenticatedRequest } from './types/auth.types';
import { LoginRequestDto } from './dto/login-request.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT token',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @Post(AuthRoute.LOGIN)
  async login(@Body() loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;
    return this.authService.authenticateAndLogin(email, password);
  }

  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication token missing or invalid',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(AuthRoute.PROTECTED)
  getProfile(@Request() req: AuthenticatedRequest): UserProfileResponseDto {
    return req.user;
  }
}
