import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';

describe('BooksModule (E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaClient;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = new PrismaClient();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    jwtService = moduleFixture.get(JwtService);

    await prisma.user.createMany({
      data: [
        { email: 'admin@test.com', password: 'password', role: 'ADMIN' },
        { email: 'user@test.com', password: 'password', role: 'USER' },
      ],
    });

    adminToken = jwtService.sign({
      sub: 1,
      role: 'ADMIN',
      email: 'admin@test.com',
    });
    userToken = jwtService.sign({
      sub: 2,
      role: 'USER',
      email: 'user@test.com',
    });
  });

  afterAll(async () => {
    if (process.env.NODE_ENV === 'test') {
      console.log('Cleaning up test data...');
      await prisma.review.deleteMany();
      await prisma.book.deleteMany();
    }
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /books', () => {
    it('should allow an admin to create a book', async () => {
      const bookData = {
        title: '1984',
        author: 'George Orwell',
        publicationYear: 1949,
        genre: 'Dystopian',
      };

      const response = await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bookData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        ...bookData,
      });
    });

    it('should not allow a user to create a book', async () => {
      const bookData = {
        title: '1984',
        author: 'George Orwell',
        publicationYear: 1949,
        genre: 'Dystopian',
      };

      await request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${userToken}`)
        .send(bookData)
        .expect(403);
    });

    it('should return 401 if no token is provided', async () => {
      const bookData = {
        title: '1984',
        author: 'George Orwell',
        publicationYear: 1949,
        genre: 'Dystopian',
      };

      await request(app.getHttpServer())
        .post('/books')
        .send(bookData)
        .expect(401);
    });
  });

  describe('GET /books', () => {
    beforeEach(async () => {
      await prisma.book.create({
        data: {
          title: 'Animal Farm',
          author: 'George Orwell',
          publicationYear: 1945,
          genre: 'Satire',
        },
      });
    });

    it('should allow an authenticated user to view books', async () => {
      const response = await request(app.getHttpServer())
        .get('/books')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toMatchObject({
        title: 'Animal Farm',
        author: 'George Orwell',
      });
    });

    it('should return 401 if no token is provided', async () => {
      await request(app.getHttpServer()).get('/books').expect(401);
    });
  });

  describe('DELETE /books/:id', () => {
    it('should allow an admin to delete a book', async () => {
      const book = await prisma.book.create({
        data: {
          title: 'Delete Me',
          author: 'Author',
          publicationYear: 2000,
          genre: 'Drama',
        },
      });

      await request(app.getHttpServer())
        .delete(`/books/${book.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deletedBook = await prisma.book.findUnique({
        where: { id: book.id },
      });
      expect(deletedBook).toBeNull();
    });

    it('should not allow a user to delete a book', async () => {
      const book = await prisma.book.create({
        data: {
          title: 'Protected Book',
          author: 'Author',
          publicationYear: 2001,
          genre: 'Drama',
        },
      });

      await request(app.getHttpServer())
        .delete(`/books/${book.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
