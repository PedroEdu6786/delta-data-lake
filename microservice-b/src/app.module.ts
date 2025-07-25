import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PermissionsController } from './permissions/permissions.controller';
import { typeOrmConfig } from './commons/configs/typeorm.config';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { LocalAuthModule } from './auth/auth.module';

@Module({
  imports: [typeOrmConfig, UsersModule, PermissionsModule, LocalAuthModule],
  controllers: [AppController, PermissionsController],
  providers: [],
})
export class AppModule {}
