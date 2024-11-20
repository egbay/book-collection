import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FilterBooksDto } from './dto/filter-book.dto';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createBookDto: CreateBookDto) {
    this.logger.log(
      `Creating a new book with data: ${JSON.stringify(createBookDto)}`,
    );
    try {
      const book = await this.prisma.book.create({
        data: createBookDto,
      });
      this.logger.log(`Book created successfully with ID: ${book.id}`);
      return book;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error creating book', error.stack);
      } else {
        this.logger.error('Error creating book', JSON.stringify(error));
      }
      throw new InternalServerErrorException('Failed to create book');
    }
  }

  async findAll(filterBooksDto: FilterBooksDto) {
    this.logger.log(
      `Fetching all books with filters: ${JSON.stringify(filterBooksDto)}`,
    );
    try {
      const { title, author, genre, sort } = filterBooksDto;

      const books = await this.prisma.book.findMany({
        where: {
          ...(title && { title: { contains: title, mode: 'insensitive' } }),
          ...(author && { author: { contains: author, mode: 'insensitive' } }),
          ...(genre && { genre: { contains: genre, mode: 'insensitive' } }),
        },
        orderBy: sort ? { [sort]: 'asc' } : undefined,
      });

      this.logger.log(`Fetched ${books.length} books successfully`);
      return books;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error fetching books', error.stack);
      } else {
        this.logger.error('Error fetching books', JSON.stringify(error));
      }
      throw new InternalServerErrorException('Failed to fetch books');
    }
  }

  async findOne(id: number) {
    this.logger.log(`Fetching book with ID: ${id}`);
    try {
      const book = await this.prisma.book.findUnique({
        where: { id },
      });

      if (!book) {
        this.logger.warn(`Book with ID: ${id} not found`);
        throw new NotFoundException(`Book with ID ${id} not found`);
      }

      this.logger.log(`Fetched book successfully with ID: ${id}`);
      return book;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error fetching book with ID: ${id}`, error.stack);
      } else {
        this.logger.error(
          `Error fetching book with ID: ${id}`,
          JSON.stringify(error),
        );
      }
      throw new InternalServerErrorException(
        `Failed to fetch book with ID ${id}`,
      );
    }
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    this.logger.log(
      `Updating book with ID: ${id} and data: ${JSON.stringify(updateBookDto)}`,
    );
    try {
      const book = await this.findOne(id);

      const updatedBook = await this.prisma.book.update({
        where: { id: book.id },
        data: updateBookDto,
      });

      this.logger.log(`Book with ID: ${id} updated successfully`);
      return updatedBook;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error updating book with ID: ${id}`, error.stack);
      } else {
        this.logger.error(
          `Error updating book with ID: ${id}`,
          JSON.stringify(error),
        );
      }
      throw new InternalServerErrorException(
        `Failed to update book with ID ${id}`,
      );
    }
  }

  async delete(id: number) {
    this.logger.log(`Deleting book with ID: ${id}`);
    try {
      const book = await this.findOne(id);

      await this.prisma.book.delete({
        where: { id: book.id },
      });

      this.logger.log(`Book with ID: ${id} deleted successfully`);
      return { message: `Book with ID ${id} deleted successfully` };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Error deleting book with ID: ${id}`, error.stack);
      } else {
        this.logger.error(
          `Error deleting book with ID: ${id}`,
          JSON.stringify(error),
        );
      }
      throw new InternalServerErrorException(
        `Failed to delete book with ID ${id}`,
      );
    }
  }
}
