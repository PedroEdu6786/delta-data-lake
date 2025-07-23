import { DataSource } from 'typeorm';
import { UserSeeder } from './user.seeder';
import { TableSeeder } from './table.seeder';
import { TablePermissionSeeder } from './table-permission.seeder';

export class DatabaseSeeder {
  static async run(dataSource: DataSource): Promise<void> {
    console.log('Starting database seeding...');

    await UserSeeder.run(dataSource);
    await TableSeeder.run(dataSource);
    await TablePermissionSeeder.run(dataSource);

    console.log('Database seeding completed!');
  }
}
