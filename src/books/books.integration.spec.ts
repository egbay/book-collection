import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { BooksModule } from './books.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaClient } from '@prisma/client';

describe('BooksModule (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BooksModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 1 };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (process.env.NODE_ENV === 'test') {
      console.log('Cleaning up test data...');
      await prisma.book.deleteMany();
    }
    await prisma.$disconnect();
    await app.close();
  });

  const validBookData = {
    title: '1984',
    author: 'George Orwell',
    publicationYear: 1949,
    genre: 'Dystopian',
  };

  describe('POST /books', () => {
    it('should create a new book', async () => {
      const response = await request(app.getHttpServer())
        .post('/books')
        .send(validBookData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        ...validBookData,
      });
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/books')
        .send({ title: '', author: '', publicationYear: 1000, genre: null })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /books', () => {
    it('should return a list of books', async () => {
      await prisma.book.create({
        data: validBookData,
      });

      const response = await request(app.getHttpServer())
        .get('/books')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toMatchObject(validBookData);
    });
  });

  describe('GET /books/:id', () => {
    it('should return a book by ID', async () => {
      const book = await prisma.book.create({
        data: validBookData,
      });

      const response = await request(app.getHttpServer())
        .get(`/books/${book.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: book.id,
        ...validBookData,
      });
    });

    it('should return 404 if book is not found', async () => {
      await request(app.getHttpServer()).get('/books/99999').expect(404);
    });
  });

  describe('PUT /books/:id', () => {
    it('should update a book by ID', async () => {
      const book = await prisma.book.create({
        data: validBookData,
      });

      const updatedBookData = {
        title: 'Animal Farm',
        author: 'George Orwell',
        publicationYear: 1945,
        genre: 'Political Satire',
      };

      const response = await request(app.getHttpServer())
        .put(`/books/${book.id}`)
        .send(updatedBookData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: book.id,
        ...updatedBookData,
      });
    });
  });

  describe('DELETE /books/:id', () => {
    it('should delete a book by ID', async () => {
      const book = await prisma.book.create({
        data: validBookData,
      });

      await request(app.getHttpServer())
        .delete(`/books/${book.id}`)
        .expect(200);

      const deletedBook = await prisma.book.findUnique({
        where: { id: book.id },
      });

      expect(deletedBook).toBeNull();
    });
  });
});
