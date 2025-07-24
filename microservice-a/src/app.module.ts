import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueryModule } from './query/query.module';
import { AuthModule } from '@arkham/auth';
import { PermissionsModule } from './permissions/permissions.module';

@Module({
  imports: [QueryModule, AuthModule, PermissionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
