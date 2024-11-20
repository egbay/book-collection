import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function seedUsers(count: number) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const password = faker.internet.password();
    const hashedPassword = await hashPassword(password);

    const user = {
      email: faker.internet.email(),
      password: hashedPassword,
      name: faker.person.firstName(),
      role: i === 0 ? 'ADMIN' : 'USER',
      address: faker.location.streetAddress(),
    };
    users.push(user);
  }
  return await prisma.user.createMany({ data: users });
}

async function seedBooks(count: number) {
  const books = [];
  for (let i = 0; i < count; i++) {
    const book = {
      title: faker.lorem.words(3),
      author: faker.person.fullName(),
      publicationYear: faker.date.past({ years: 50 }).getFullYear(),
      genre: faker.helpers.arrayElement([
        'Fiction',
        'Non-fiction',
        'Science',
        'Fantasy',
        'Biography',
      ]),
      popularity: 0,
      rating: 0,
    };
    books.push(book);
  }
  return await prisma.book.createMany({ data: books });
}

async function seedReviews(count: number) {
  const books = await prisma.book.findMany();
  const users = await prisma.user.findMany();

  if (books.length === 0 || users.length === 0) {
    console.log('No books or users found. Seed books and users first.');
    return;
  }

  for (let i = 0; i < count; i++) {
    const review = {
      content: faker.lorem.sentence(),
      rating: faker.number.int({ min: 1, max: 5 }),
      userId: faker.helpers.arrayElement(users).id,
      bookId: faker.helpers.arrayElement(books).id,
    };
    await prisma.review.create({ data: review });
  }
}

async function main() {
  console.log('Seeding data...');

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot run seed in production');
  }

  console.log('Seeding users...');
  await seedUsers(5);

  console.log('Seeding books...');
  await seedBooks(5);

  console.log('Seeding reviews...');
  await seedReviews(10);

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
