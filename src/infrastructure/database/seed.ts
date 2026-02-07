import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BookEntity } from './entities/BookEntity';
import { UserEntity } from './entities/UserEntity';

// This seed script populates the database with sample data
async function seed(): Promise<void> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'library_user',
    password: process.env.DB_PASSWORD || 'library_password',
    database: process.env.DB_DATABASE || 'digital_library',
    entities: [BookEntity, UserEntity],
    synchronize: true,
  });

  await dataSource.initialize();

  // Seed Books
  const bookRepository = dataSource.getRepository(BookEntity);
  const books = [
    {
      id: uuidv4(),
      isbn: '978-0-13-468599-1',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      publicationYear: 2008,
      category: 'Software Engineering',
      availableCopies: 3,
      totalCopies: 3,
    },
    {
      id: uuidv4(),
      isbn: '978-0-201-63361-0',
      title: 'Design Patterns',
      author: 'Gang of Four',
      publicationYear: 1994,
      category: 'Software Engineering',
      availableCopies: 2,
      totalCopies: 2,
    },
    {
      id: uuidv4(),
      isbn: '978-0-13-235088-4',
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      publicationYear: 2017,
      category: 'Software Architecture',
      availableCopies: 5,
      totalCopies: 5,
    },
  ];

  await bookRepository.save(books);

  // Seed Users
  const userRepository = dataSource.getRepository(UserEntity);
  const users = [
    {
      id: uuidv4(),
      name: 'John Doe',
      email: 'john.student@example.com',
      type: 'STUDENT',
    },
    {
      id: uuidv4(),
      name: 'Jane Smith',
      email: 'jane.teacher@example.com',
      type: 'TEACHER',
    },
    {
      id: uuidv4(),
      name: 'Admin User',
      email: 'admin@example.com',
      type: 'ADMIN',
    },
  ];

  await userRepository.save(users);

  console.log('✅ Database seeded successfully!');
  console.log(`Created ${books.length} books and ${users.length} users`);

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
