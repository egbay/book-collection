import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FilterBooksDto } from './dto/filter-book.dto';
import { BookEntity } from './entities/book.entity';

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Book successfully created.',
    type: BookEntity,
  })
  async createBook(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List of all books.',
    type: [BookEntity],
  })
  async getAllBooks(@Query() filterBooksDto: FilterBooksDto) {
    return this.booksService.findAll(filterBooksDto);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'The ID of the book to retrieve',
  })
  @ApiResponse({ status: 200, description: 'Book details.', type: BookEntity })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  async getBookById(@Param('id') id: string) {
    return this.booksService.findOne(+id);
  }

  @Put(':id')
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'The ID of the book to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Book successfully updated.',
    type: BookEntity,
  })
  async updateBook(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    return this.booksService.update(+id, updateBookDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'The ID of the book to delete',
  })
  @ApiResponse({ status: 200, description: 'Book successfully deleted.' })
  async deleteBook(@Param('id') id: string) {
    return this.booksService.delete(+id);
  }
}
