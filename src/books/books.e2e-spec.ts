import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { Role } from '@prisma/client';

describe('Books (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let createdBookId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const uniqueEmail = `testuser+${Date.now()}@example.com`;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: uniqueEmail,
        password: 'password',
        role: Role.ADMIN,
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: uniqueEmail,
        password: 'password',
      })
      .expect(200);

    token = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/books (POST) should create a new book', async () => {
    const createBookDto = {
      title: 'Test Book',
      author: 'Test Author',
      publicationYear: 2024,
      genre: 'Fiction',
    };

    const response = await request(app.getHttpServer())
      .post('/books')
      .set('Authorization', `Bearer ${token}`)
      .send(createBookDto)
      .expect(201);

    expect(response.body).toMatchObject(createBookDto);
    createdBookId = response.body.id;
  });

  it('/books (GET) should retrieve a list of books', async () => {
    const response = await request(app.getHttpServer())
      .get('/books')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('/books/:id (GET) should retrieve a single book by ID', async () => {
    if (!createdBookId) throw new Error('createdBookId is not set.');

    const response = await request(app.getHttpServer())
      .get(`/books/${createdBookId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', createdBookId);
  });

  it('/books/:id (GET) should return 404 for a non-existent book ID', async () => {
    await request(app.getHttpServer())
      .get('/books/99999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('/books/:id (PUT) should update an existing book', async () => {
    const updateBookDto = {
      title: 'Updated Test Book',
    };

    const response = await request(app.getHttpServer())
      .put(`/books/${createdBookId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateBookDto)
      .expect(200);

    expect(response.body).toHaveProperty('title', 'Updated Test Book');
  });

  it('/books/:id (DELETE) should delete an existing book', async () => {
    if (!createdBookId) throw new Error('createdBookId is not set.');

    await request(app.getHttpServer())
      .delete(`/books/${createdBookId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
