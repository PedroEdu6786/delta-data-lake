// in app.module.ts or a dedicated database.module.ts
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import * as config from 'config';

export const typeOrmConfig = TypeOrmModule.forRoot({
  type: 'mysql',
  host: config.get('database.host'),
  port: config.get<number>('database.port'),
  username: config.get('database.user'),
  password: config.get('database.password'),
  database: config.get('database.name'),
  entities: [path.join(__dirname, '../../**/*.entity.{js,ts}')],
  synchronize: true, // Only use in dev — auto creates tables
});
