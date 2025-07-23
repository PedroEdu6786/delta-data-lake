import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueryModule } from './query/query.module';
import { AuthModule } from '@arkham/auth';
import { PermissionsService } from './permissions/permissions.service';

@Module({
  imports: [QueryModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, PermissionsService],
})
export class AppModule {}
