// in app.module.ts or a dedicated database.module.ts
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import config from 'config'; // ✅ correct

export const typeOrmConfig = TypeOrmModule.forRoot({
  type: 'mysql',
  host: config.get<string>('database.host'),
  port: config.get<number>('database.port'),
  username: config.get<string>('database.user'),
  password: config.get<string>('database.password'),
  database: config.get<string>('database.name'),
  entities: [path.join(__dirname, '../../**/*.entity.{js,ts}')],
  synchronize: true, // Only use in dev — auto creates tables
});
