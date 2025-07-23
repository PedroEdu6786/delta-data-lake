import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PermissionsController } from './permissions/permissions.controller';
import { typeOrmConfig } from './commons/configs/typeorm.config';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PermissionsModule } from './permissions/permissions.module';
import { LocalAuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // So it's available app-wide
      envFilePath: '.env', // Optional if your file is named `.env`
    }),
    typeOrmConfig,
    UsersModule,
    PermissionsModule,
    LocalAuthModule,
  ],
  controllers: [AppController, PermissionsController],
  providers: [AppService],
})
export class AppModule {}
