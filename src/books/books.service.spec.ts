import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe('BooksService', () => {
  let service: BooksService;
  let prismaMock: any;
  let loggerMock: jest.Mocked<any>;

  beforeEach(async () => {
    prismaMock = {
      book: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      review: {
        aggregate: jest.fn(),
        count: jest.fn(),
      },
    };

    loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: WINSTON_MODULE_PROVIDER, useValue: loggerMock },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new book', async () => {
      const createBookDto = {
        title: '1984',
        author: 'George Orwell',
        publicationYear: 1949,
        genre: 'Dystopian',
      };
      const createdBook = { id: 1, ...createBookDto };

      prismaMock.book.create.mockResolvedValue(createdBook);

      const result = await service.create(1, createBookDto);

      expect(result).toEqual(createdBook);
      expect(prismaMock.book.create).toHaveBeenCalledWith({
        data: createBookDto,
      });
      expect(loggerMock.info).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      prismaMock.book.create.mockRejectedValue(new Error('Create error'));

      const createBookDto = {
        title: '1984',
        author: 'George Orwell',
        publicationYear: 1949,
        genre: 'Dystopian',
      };

      await expect(service.create(1, createBookDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error creating book',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all books with pagination', async () => {
      const filterBooksDto = {
        title: '1984',
        author: 'George Orwell',
        genre: 'Dystopian',
        sort: 'title',
        page: 1,
        limit: 2,
      };
      const mockBooks = [
        { id: 1, title: '1984', author: 'George Orwell' },
        { id: 2, title: 'Animal Farm', author: 'George Orwell' },
      ];

      prismaMock.book.findMany.mockResolvedValue(mockBooks);
      prismaMock.book.count.mockResolvedValue(10);

      const result = await service.findAll(1, filterBooksDto);

      expect(result).toEqual({
        data: mockBooks,
        total: 10,
        page: 1,
        limit: 2,
        totalPages: 5,
      });
      expect(prismaMock.book.findMany).toHaveBeenCalledWith({
        where: {
          title: { contains: '1984', mode: 'insensitive' },
          author: { contains: 'George Orwell', mode: 'insensitive' },
          genre: { contains: 'Dystopian', mode: 'insensitive' },
        },
        orderBy: { title: 'asc' },
        skip: 0,
        take: 2,
      });
      expect(prismaMock.book.count).toHaveBeenCalled();
    });

    it('should handle errors gracefully during pagination', async () => {
      prismaMock.book.findMany.mockRejectedValue(new Error('Fetch error'));

      const filterBooksDto = {
        title: '1984',
        author: 'George Orwell',
        genre: 'Dystopian',
        sort: 'title',
        page: 1,
        limit: 2,
      };

      await expect(service.findAll(1, filterBooksDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error fetching books',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single book', async () => {
      const book = { id: 1, title: '1984', author: 'George Orwell' };

      prismaMock.book.findUnique.mockResolvedValue(book);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(book);
      expect(prismaMock.book.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if book is not found', async () => {
      prismaMock.book.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);

      expect(loggerMock.warn).toHaveBeenCalledWith({
        level: 'warn',
        message: 'Book with ID 1 not found',
        eventId: expect.any(String),
        userId: 1,
        details: { id: 1 },
      });
    });
  });

  describe('update', () => {
    it('should update a book', async () => {
      const updateBookDto = { title: 'Animal Farm' };
      const updatedBook = { id: 1, title: 'Animal Farm' };

      prismaMock.book.findUnique.mockResolvedValue(updatedBook);
      prismaMock.book.update.mockResolvedValue(updatedBook);

      const result = await service.update(1, 1, updateBookDto);

      expect(result).toEqual(updatedBook);
      expect(prismaMock.book.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateBookDto,
      });
    });

    it('should handle errors gracefully', async () => {
      prismaMock.book.update.mockRejectedValue(new Error('Update error'));

      await expect(service.update(1, 1, {})).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error updating book',
        }),
      );
    });
  });

  describe('delete', () => {
    it('should delete a book', async () => {
      const book = { id: 1, title: '1984' };

      prismaMock.book.findUnique.mockResolvedValue(book);
      prismaMock.book.delete.mockResolvedValue(book);

      const result = await service.delete(1, 1);

      expect(result).toEqual({
        message: `Book with ID 1 deleted successfully`,
      });
      expect(prismaMock.book.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should handle errors gracefully', async () => {
      prismaMock.book.findUnique.mockRejectedValue(new Error('Delete error'));

      await expect(service.delete(1, 1)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error deleting book',
        }),
      );
    });
  });
});
