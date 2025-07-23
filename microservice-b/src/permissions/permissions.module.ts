import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from './permissions.service';
import { TableEntity } from './entities/table.entity';
import { TablePermissionEntity } from './entities/table-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TableEntity, TablePermissionEntity])],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
