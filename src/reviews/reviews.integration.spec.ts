import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ReviewsModule } from './reviews.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaClient } from '@prisma/client';
import { RolesGuard } from 'src/auth/roles.guard';

describe('ReviewsModule (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ReviewsModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
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
      await prisma.review.deleteMany();
      await prisma.book.deleteMany();
    }
    await prisma.$disconnect();
    await app.close();
  });

  const validReviewData = {
    bookId: 1,
    userId: 1,
    content: 'This is a great book!',
    rating: 5,
  };

  describe('POST /reviews', () => {
    it('should create a new review', async () => {
      const book = await prisma.book.create({
        data: {
          title: '1984',
          author: 'George Orwell',
          publicationYear: 1949,
          genre: 'Dystopian',
        },
      });

      const response = await request(app.getHttpServer())
        .post('/reviews')
        .send({ ...validReviewData, bookId: book.id })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        ...validReviewData,
        bookId: book.id,
      });
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/reviews')
        .send({ content: '', rating: 6 })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /reviews', () => {
    it('should return a list of reviews', async () => {
      const book = await prisma.book.create({
        data: {
          title: '1984',
          author: 'George Orwell',
          publicationYear: 1949,
          genre: 'Dystopian',
        },
      });

      const review = await prisma.review.create({
        data: {
          bookId: book.id,
          userId: 1,
          content: 'A fantastic dystopian novel!',
          rating: 5,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/reviews')
        .expect(200);

      expect(response.body).toMatchObject([
        {
          id: review.id,
          bookId: book.id,
          content: review.content,
          rating: review.rating,
        },
      ]);
    });
  });

  describe('GET /reviews/:id', () => {
    it('should return a review by ID', async () => {
      const book = await prisma.book.create({
        data: {
          title: '1984',
          author: 'George Orwell',
          publicationYear: 1949,
          genre: 'Dystopian',
        },
      });

      const review = await prisma.review.create({
        data: {
          bookId: book.id,
          userId: 1,
          content: 'A fantastic dystopian novel!',
          rating: 5,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/reviews/${review.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: review.id,
        bookId: book.id,
        content: review.content,
        rating: review.rating,
      });
    });

    it('should return 404 if the review is not found', async () => {
      await request(app.getHttpServer()).get('/reviews/99999').expect(404);
    });
  });

  describe('PUT /reviews/:id', () => {
    it('should update a review by ID', async () => {
      const book = await prisma.book.create({
        data: {
          title: '1984',
          author: 'George Orwell',
          publicationYear: 1949,
          genre: 'Dystopian',
        },
      });

      const review = await prisma.review.create({
        data: {
          bookId: book.id,
          userId: 1,
          content: 'A fantastic dystopian novel!',
          rating: 5,
        },
      });

      const updatedReviewData = {
        content: 'An even better review after a re-read!',
        rating: 4,
      };

      const response = await request(app.getHttpServer())
        .patch(`/reviews/${review.id}`)
        .send(updatedReviewData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: review.id,
        bookId: book.id,
        ...updatedReviewData,
      });
    });
  });

  describe('DELETE /reviews/:id', () => {
    it('should delete a review by ID', async () => {
      const book = await prisma.book.create({
        data: {
          title: '1984',
          author: 'George Orwell',
          publicationYear: 1949,
          genre: 'Dystopian',
        },
      });

      const review = await prisma.review.create({
        data: {
          bookId: book.id,
          userId: 1,
          content: 'A fantastic dystopian novel!',
          rating: 5,
        },
      });

      await request(app.getHttpServer())
        .delete(`/reviews/${review.id}`)
        .expect(200);

      const deletedReview = await prisma.review.findUnique({
        where: { id: review.id },
      });

      expect(deletedReview).toBeNull();
    });
  });
});
