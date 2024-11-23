import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { BooksService } from './books.service';

describe('BooksService (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let booksService: BooksService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    booksService = app.get(BooksService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.review.deleteMany({});
    await prisma.book.deleteMany({});
    await app.close();
  });

  describe('create', () => {
    it('should create a new book', async () => {
      const createBookDto = {
        title: 'Test Book',
        author: 'Test Author',
        genre: 'Fiction',
        publicationYear: 2022,
      };

      const book = await booksService.create(1, createBookDto);

      expect(book).toMatchObject(createBookDto);

      const foundBook = await prisma.book.findUnique({
        where: { id: book.id },
      });
      expect(foundBook).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should retrieve all books with pagination', async () => {
      const filterBooksDto = {
        page: 1,
        limit: 10,
        sort: 'title',
      };

      const result = await booksService.findAll(1, filterBooksDto);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('totalPages');
    });
  });

  describe('findOne', () => {
    it('should retrieve a single book by ID', async () => {
      const createBookDto = {
        title: 'Another Test Book',
        author: 'Another Author',
        genre: 'Non-Fiction',
        publicationYear: 2021,
      };

      const createdBook = await booksService.create(1, createBookDto);

      const foundBook = await booksService.findOne(1, createdBook.id);

      expect(foundBook).toMatchObject(createBookDto);
    });

    it('should throw NotFoundException for a non-existent book ID', async () => {
      await expect(booksService.findOne(1, 99999)).rejects.toThrow(
        'Book with ID 99999 not found',
      );
    });
  });

  describe('update', () => {
    it('should update an existing book', async () => {
      const createBookDto = {
        title: 'To Be Updated',
        author: 'Author',
        genre: 'Fiction',
        publicationYear: 2020,
      };

      const book = await booksService.create(1, createBookDto);

      const updateBookDto = {
        title: 'Updated Title',
        author: 'Updated Author',
      };

      const updatedBook = await booksService.update(1, book.id, updateBookDto);

      expect(updatedBook.title).toBe(updateBookDto.title);
      expect(updatedBook.author).toBe(updateBookDto.author);
    });
  });

  describe('delete', () => {
    it('should delete an existing book', async () => {
      const createBookDto = {
        title: 'To Be Deleted',
        author: 'Author',
        genre: 'Fiction',
        publicationYear: 2019,
      };

      const book = await booksService.create(1, createBookDto);

      const result = await booksService.delete(1, book.id);

      expect(result.message).toBe(
        `Book with ID ${book.id} deleted successfully`,
      );

      const deletedBook = await prisma.book.findUnique({
        where: { id: book.id },
      });

      expect(deletedBook).toBeNull();
    });
  });
});
