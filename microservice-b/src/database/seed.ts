import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { DatabaseSeeder } from './seeders';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    await DatabaseSeeder.run(dataSource);
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
