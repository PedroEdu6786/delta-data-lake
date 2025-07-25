import { DataSource } from 'typeorm';
import config from 'config';
import { DatabaseSeeder } from './seeders';

const dataSource = new DataSource({
  type: 'mysql',
  host: config.get<string>('database.host'),
  port: config.get<number>('database.port'),
  username: config.get<string>('database.user'),
  password: config.get<string>('database.password'),
  database: config.get<string>('database.name'),
  entities: [__dirname + '/../../**/*.entity.{js,ts}'],
  synchronize: true,
});

async function bootstrap() {
  try {
    await dataSource.initialize();
    await DatabaseSeeder.run(dataSource);
    console.log('Seeding completed!');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await dataSource.destroy();
  }
}

bootstrap();
