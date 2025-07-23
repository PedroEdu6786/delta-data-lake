import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { DatabaseSeeder } from './seeders';

async function nuke() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('🔥 Nuking database...');

    // Drop all tables
    await dataSource.dropDatabase();

    // Recreate database schema
    await dataSource.synchronize();

    console.log('💥 Database nuked successfully!');
    console.log('🌱 Re-seeding database...');

    // Re-seed the database
    await DatabaseSeeder.run(dataSource);

    console.log('✅ Database nuke and re-seed completed!');
  } catch (error) {
    console.error('❌ Nuke failed:', error);
  } finally {
    await app.close();
  }
}

nuke();
