import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FilterBooksDto } from './dto/filter-book.dto';
import { BookEntity } from './entities/book.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '../auth/role.enum';

@ApiTags('books')
@Controller('books')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiBody({
    description: 'The data needed to create a new book',
    type: CreateBookDto,
    examples: {
      example1: {
        summary: 'Valid Book',
        value: {
          title: '1984',
          author: 'George Orwell',
          publicationYear: 1949,
          genre: 'Dystopian',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Book successfully created.',
    type: BookEntity,
  })
  async createBook(@Req() req, @Body() createBookDto: CreateBookDto) {
    const userId = req.user.userId;
    return this.booksService.create(userId, createBookDto);
  }

  @Get()
  @Roles(Role.USER, Role.ADMIN)
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Filter books by title',
    example: '1984',
  })
  @ApiQuery({
    name: 'author',
    required: false,
    description: 'Filter books by author',
    example: 'George Orwell',
  })
  @ApiQuery({
    name: 'genre',
    required: false,
    description: 'Filter books by genre',
    example: 'Dystopian',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort books by a specific field',
    example: 'title',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all books.',
    type: [BookEntity],
  })
  async getAllBooks(@Req() req, @Query() filterBooksDto: FilterBooksDto) {
    const userId = req.user.userId;
    return this.booksService.findAll(userId, filterBooksDto);
  }

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN)
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'The ID of the book to retrieve',
  })
  @ApiResponse({ status: 200, description: 'Book details.', type: BookEntity })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async getBookById(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    const book = await this.booksService.findOne(userId, +id);

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'The ID of the book to update',
  })
  @ApiBody({
    description: 'The data needed to update an existing book',
    type: UpdateBookDto,
    examples: {
      example1: {
        summary: 'Valid Update',
        value: {
          title: 'Animal Farm',
          author: 'George Orwell',
          publicationYear: 1945,
          genre: 'Political Satire',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Book successfully updated.',
    type: BookEntity,
  })
  async updateBook(
    @Req() req,
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    const userId = req.user.userId;
    return this.booksService.update(userId, +id, updateBookDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'The ID of the book to delete',
  })
  @ApiResponse({ status: 200, description: 'Book successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async deleteBook(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.booksService.delete(userId, +id);
  }
}
