import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export class UserSeeder {
  static async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping user seeding');
      return;
    }

    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const employeePassword = await bcrypt.hash('employee123', saltRounds);
    const johnPassword = await bcrypt.hash('john123', saltRounds);

    const users = [
      {
        email: 'admin@example.com',
        name: 'Admin User',
        passwordHash: adminPassword,
      },
      {
        email: 'employee@example.com',
        name: 'Employee User',
        passwordHash: employeePassword,
      },
      {
        email: 'john.doe@example.com',
        name: 'John Doe',
        passwordHash: johnPassword,
      },
    ];

    await userRepository.save(users);
    console.log('Users seeded successfully');
  }
}
