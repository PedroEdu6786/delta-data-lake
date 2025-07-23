import { DataSource } from 'typeorm';
import { TableEntity } from '../../permissions/entities/table.entity';

export class TableSeeder {
  static async run(dataSource: DataSource): Promise<void> {
    const tableRepository = dataSource.getRepository(TableEntity);

    // Check if tables already exist
    const existingTables = await tableRepository.count();
    if (existingTables > 0) {
      console.log('Tables already exist, skipping table seeding');
      return;
    }

    const tables = [
      {
        name: 'users',
        description: 'User management table',
        schema: {
          columns: ['id', 'email', 'name', 'passwordHash'],
          types: ['uuid', 'varchar', 'varchar', 'varchar'],
        },
        version: '1.0.0',
      },
      {
        name: 'products',
        description: 'Product catalog table',
        schema: {
          columns: ['id', 'name', 'price', 'description'],
          types: ['uuid', 'varchar', 'decimal', 'text'],
        },
        version: '1.0.0',
      },
      {
        name: 'orders',
        description: 'Customer orders table',
        schema: {
          columns: ['id', 'userId', 'total', 'status'],
          types: ['uuid', 'uuid', 'decimal', 'varchar'],
        },
        version: '1.0.0',
      },
    ];

    await tableRepository.save(tables);
    console.log('Tables seeded successfully');
  }
}
