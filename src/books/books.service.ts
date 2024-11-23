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
import { logSuccess, logError, logWarn } from '../utils/logger.util';

@Injectable()
export class BooksService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async calculateBookRating(bookId: number): Promise<number> {
    const result = await this.prisma.review.aggregate({
      where: { bookId },
      _avg: { rating: true },
    });
    return result._avg.rating || 0;
  }

  async calculateBookPopularity(bookId: number): Promise<number> {
    const result = await this.prisma.review.count({
      where: { bookId },
    });
    return result;
  }

  async create(userId: number, createBookDto: CreateBookDto) {
    const eventId = randomUUID();
    logSuccess(this.logger, 'Creating a new book', eventId, userId, {
      createBookDto,
    });

    try {
      const book = await this.prisma.book.create({ data: createBookDto });
      logSuccess(this.logger, 'Book created successfully', eventId, userId, {
        bookId: book.id,
      });
      return book;
    } catch (error) {
      logError(this.logger, 'Error creating book', eventId, userId, error);
      throw new InternalServerErrorException('Failed to create book');
    }
  }

  async findAll(userId: number, filterBooksDto: FilterBooksDto) {
    const eventId = randomUUID();
    logSuccess(this.logger, 'Fetching all books', eventId, userId, {
      filters: filterBooksDto,
    });

    const { title, author, genre, page = 1, limit = 10, sort } = filterBooksDto;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    try {
      const [books, total] = await Promise.all([
        this.prisma.book.findMany({
          where: {
            ...(title && {
              title: { contains: title, mode: 'insensitive' },
            }),
            ...(author && {
              author: { contains: author, mode: 'insensitive' },
            }),
            ...(genre && {
              genre: { contains: genre, mode: 'insensitive' },
            }),
          },
          orderBy: sort ? { [sort]: 'asc' } : undefined,
          skip,
          take: take,
        }),
        this.prisma.book.count({
          where: {
            ...(title && {
              title: { contains: title, mode: 'insensitive' },
            }),
            ...(author && {
              author: { contains: author, mode: 'insensitive' },
            }),
            ...(genre && {
              genre: { contains: genre, mode: 'insensitive' },
            }),
          },
        }),
      ]);

      logSuccess(this.logger, 'Books fetched successfully', eventId, userId, {
        count: books.length,
        total,
      });

      return {
        data: books,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logError(this.logger, 'Error fetching books', eventId, userId, error);
      throw new InternalServerErrorException('Failed to fetch books');
    }
  }

  async findOne(userId: number, id: number) {
    const eventId = randomUUID();
    logSuccess(this.logger, `Fetching book with ID: ${id}`, eventId, userId, {
      id,
    });

    try {
      const book = await this.prisma.book.findUnique({ where: { id } });
      if (!book) {
        logWarn(this.logger, `Book with ID ${id} not found`, eventId, userId, {
          id,
        });
        throw new NotFoundException(`Book with ID ${id} not found`);
      }
      logSuccess(this.logger, 'Book fetched successfully', eventId, userId, {
        bookId: id,
      });
      return book;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logError(this.logger, 'Error fetching book', eventId, userId, error);
      throw new InternalServerErrorException(
        `Failed to fetch book with ID ${id}`,
      );
    }
  }

  async update(userId: number, id: number, updateBookDto: UpdateBookDto) {
    const eventId = randomUUID();
    logSuccess(this.logger, `Updating book with ID: ${id}`, eventId, userId, {
      updateBookDto,
    });

    try {
      const existingBook = await this.findOne(userId, id);
      const updatedBook = await this.prisma.book.update({
        where: { id: existingBook.id },
        data: updateBookDto,
      });
      logSuccess(this.logger, 'Book updated successfully', eventId, userId, {
        bookId: id,
      });
      return updatedBook;
    } catch (error) {
      logError(this.logger, 'Error updating book', eventId, userId, error);
      throw new InternalServerErrorException(
        `Failed to update book with ID ${id}`,
      );
    }
  }

  async delete(userId: number, id: number) {
    const eventId = randomUUID();
    logSuccess(this.logger, `Deleting book with ID: ${id}`, eventId, userId, {
      id,
    });

    try {
      const existingBook = await this.findOne(userId, id);
      await this.prisma.book.delete({ where: { id: existingBook.id } });
      logSuccess(this.logger, 'Book deleted successfully', eventId, userId, {
        bookId: id,
      });
      return { message: `Book with ID ${id} deleted successfully` };
    } catch (error) {
      logError(this.logger, 'Error deleting book', eventId, userId, error);
      throw new InternalServerErrorException(
        `Failed to delete book with ID ${id}`,
      );
    }
  }
}
