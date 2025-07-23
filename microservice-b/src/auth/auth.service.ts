import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    const match = await bcrypt.compare(password, user.passwordHash);
    return match ? user : null;
  }

  login(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
