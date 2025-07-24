import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [HttpModule],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
