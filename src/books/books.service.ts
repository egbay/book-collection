import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FilterBooksDto } from './dto/filter-book.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  private logSuccess(
    message: string,
    eventId: string,
    userId: number,
    data: any = {},
  ) {
    this.logger.info(message, {
      timestamp: new Date().toISOString(),
      eventId,
      userId,
      meta: data,
    });
  }

  private logError(
    message: string,
    eventId: string,
    userId: number,
    error: any,
  ) {
    const errorMeta =
      error instanceof Error ? { stack: error.stack } : { error };
    this.logger.error(message, {
      timestamp: new Date().toISOString(),
      eventId,
      userId,
      meta: errorMeta,
    });
  }

  async create(userId: number, createBookDto: CreateBookDto) {
    const eventId = randomUUID();
    this.logSuccess('Creating a new book', eventId, userId, { createBookDto });

    try {
      const book = await this.prisma.book.create({ data: createBookDto });
      this.logSuccess('Book created successfully', eventId, userId, {
        bookId: book.id,
      });
      return book;
    } catch (error) {
      this.logError('Error creating book', eventId, userId, error);
      throw new InternalServerErrorException('Failed to create book');
    }
  }

  async findAll(userId: number, filterBooksDto: FilterBooksDto) {
    const eventId = randomUUID();
    this.logSuccess('Fetching all books', eventId, userId, {
      filters: filterBooksDto,
    });

    try {
      const books = await this.prisma.book.findMany({
        where: {
          ...(filterBooksDto.title && {
            title: { contains: filterBooksDto.title, mode: 'insensitive' },
          }),
          ...(filterBooksDto.author && {
            author: { contains: filterBooksDto.author, mode: 'insensitive' },
          }),
          ...(filterBooksDto.genre && {
            genre: { contains: filterBooksDto.genre, mode: 'insensitive' },
          }),
        },
        orderBy: filterBooksDto.sort
          ? { [filterBooksDto.sort]: 'asc' }
          : undefined,
      });
      this.logSuccess('Books fetched successfully', eventId, userId, {
        count: books.length,
      });
      return books;
    } catch (error) {
      this.logError('Error fetching books', eventId, userId, error);
      throw new InternalServerErrorException('Failed to fetch books');
    }
  }

  async findOne(userId: number, id: number) {
    const eventId = randomUUID();
    this.logSuccess(`Fetching book with ID: ${id}`, eventId, userId);

    try {
      const book = await this.prisma.book.findUnique({ where: { id } });
      if (!book) {
        this.logger.warn(`Book with ID ${id} not found`, { userId, eventId });
        throw new NotFoundException(`Book with ID ${id} not found`);
      }
      this.logSuccess('Book fetched successfully', eventId, userId, {
        bookId: id,
      });
      return book;
    } catch (error) {
      this.logError('Error fetching book', eventId, userId, error);
      throw new InternalServerErrorException(
        `Failed to fetch book with ID ${id}`,
      );
    }
  }

  async update(userId: number, id: number, updateBookDto: UpdateBookDto) {
    const eventId = randomUUID();
    this.logSuccess(`Updating book with ID: ${id}`, eventId, userId, {
      updateBookDto,
    });

    try {
      const existingBook = await this.findOne(userId, id);
      const updatedBook = await this.prisma.book.update({
        where: { id: existingBook.id },
        data: updateBookDto,
      });
      this.logSuccess('Book updated successfully', eventId, userId, {
        bookId: id,
      });
      return updatedBook;
    } catch (error) {
      this.logError('Error updating book', eventId, userId, error);
      throw new InternalServerErrorException(
        `Failed to update book with ID ${id}`,
      );
    }
  }

  async delete(userId: number, id: number) {
    const eventId = randomUUID();
    this.logSuccess(`Deleting book with ID: ${id}`, eventId, userId);

    try {
      const existingBook = await this.findOne(userId, id);
      await this.prisma.book.delete({ where: { id: existingBook.id } });
      this.logSuccess('Book deleted successfully', eventId, userId, {
        bookId: id,
      });
      return { message: `Book with ID ${id} deleted successfully` };
    } catch (error) {
      this.logError('Error deleting book', eventId, userId, error);
      throw new InternalServerErrorException(
        `Failed to delete book with ID ${id}`,
      );
    }
  }
}
