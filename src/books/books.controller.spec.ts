import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FilterBooksDto } from './dto/filter-book.dto';
import { NotFoundException } from '@nestjs/common';

describe('BooksController', () => {
  let controller: BooksController;

  const mockBooksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: mockBooksService,
        },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createBook', () => {
    it('should create a new book', async () => {
      const createBookDto: CreateBookDto = {
        title: '1984',
        author: 'George Orwell',
        publicationYear: 1949,
        genre: 'Dystopian',
      };
      const userId = 1;

      mockBooksService.create.mockResolvedValue('Book created');
      const result = await controller.createBook(
        { user: { userId } },
        createBookDto,
      );

      expect(result).toEqual('Book created');
      expect(mockBooksService.create).toHaveBeenCalledWith(
        userId,
        createBookDto,
      );
    });

    it('should throw an error when service fails', async () => {
      const createBookDto: CreateBookDto = {
        title: '1984',
        author: 'George Orwell',
        publicationYear: 1949,
        genre: 'Dystopian',
      };
      const userId = 1;

      mockBooksService.create.mockRejectedValue(
        new Error('Failed to create book'),
      );

      await expect(
        controller.createBook({ user: { userId } }, createBookDto),
      ).rejects.toThrow('Failed to create book');
    });
  });

  describe('getAllBooks', () => {
    it('should return all books', async () => {
      const userId = 1;
      const filterBooksDto: FilterBooksDto = {
        title: '1984',
        author: 'George Orwell',
        genre: 'Dystopian',
        sort: 'title',
      };
      const mockBooks = [
        { id: 1, title: '1984', author: 'George Orwell' },
        { id: 2, title: 'Animal Farm', author: 'George Orwell' },
      ];

      mockBooksService.findAll.mockResolvedValue(mockBooks);

      const result = await controller.getAllBooks(
        { user: { userId } },
        filterBooksDto,
      );

      expect(result).toEqual(mockBooks);
      expect(mockBooksService.findAll).toHaveBeenCalledWith(
        userId,
        filterBooksDto,
      );
    });
  });

  describe('getBookById', () => {
    it('should return a single book by ID', async () => {
      const userId = 1;
      const bookId = 1;
      const mockBook = { id: bookId, title: '1984', author: 'George Orwell' };

      mockBooksService.findOne.mockResolvedValue(mockBook);

      const result = await controller.getBookById(
        { user: { userId } },
        bookId.toString(),
      );

      expect(result).toEqual(mockBook);
      expect(mockBooksService.findOne).toHaveBeenCalledWith(userId, bookId);
    });

    it('should throw an error if book is not found', async () => {
      const userId = 1;
      const bookId = 1;

      mockBooksService.findOne.mockResolvedValue(null);

      await expect(
        controller.getBookById({ user: { userId } }, bookId.toString()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBook', () => {
    it('should update a book', async () => {
      const userId = 1;
      const bookId = 1;
      const updateBookDto: UpdateBookDto = {
        title: 'Animal Farm',
        author: 'George Orwell',
        publicationYear: 1945,
        genre: 'Political Satire',
      };

      mockBooksService.update.mockResolvedValue('Book updated');

      const result = await controller.updateBook(
        { user: { userId } },
        bookId.toString(),
        updateBookDto,
      );

      expect(result).toEqual('Book updated');
      expect(mockBooksService.update).toHaveBeenCalledWith(
        userId,
        bookId,
        updateBookDto,
      );
    });

    it('should throw an error if book is not found during update', async () => {
      const userId = 1;
      const bookId = 1;
      const updateBookDto: UpdateBookDto = {
        title: 'Animal Farm',
        author: 'George Orwell',
        publicationYear: 1945,
        genre: 'Political Satire',
      };

      mockBooksService.update.mockRejectedValue(new Error('Book not found'));

      await expect(
        controller.updateBook(
          { user: { userId } },
          bookId.toString(),
          updateBookDto,
        ),
      ).rejects.toThrow('Book not found');
    });
  });

  describe('deleteBook', () => {
    it('should delete a book', async () => {
      const userId = 1;
      const bookId = 1;

      mockBooksService.delete.mockResolvedValue('Book deleted');

      const result = await controller.deleteBook(
        { user: { userId } },
        bookId.toString(),
      );

      expect(result).toEqual('Book deleted');
      expect(mockBooksService.delete).toHaveBeenCalledWith(userId, bookId);
    });

    it('should throw an error if book is not found during deletion', async () => {
      const userId = 1;
      const bookId = 1;

      mockBooksService.delete.mockRejectedValue(new Error('Book not found'));

      await expect(
        controller.deleteBook({ user: { userId } }, bookId.toString()),
      ).rejects.toThrow('Book not found');
    });
  });
});
