import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { FilterBooksDto } from './dto/filter-book.dto';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  async create(createBookDto: CreateBookDto) {
    return this.prisma.book.create({
      data: createBookDto,
    });
  }

  async findAll(filterBooksDto: FilterBooksDto) {
    const { title, author, genre, sort } = filterBooksDto;

    return this.prisma.book.findMany({
      where: {
        ...(title && { title: { contains: title, mode: 'insensitive' } }),
        ...(author && { author: { contains: author, mode: 'insensitive' } }),
        ...(genre && { genre: { contains: genre, mode: 'insensitive' } }),
      },
      orderBy: sort ? { [sort]: 'asc' } : undefined,
    });
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    const book = await this.findOne(id);

    return this.prisma.book.update({
      where: { id: book.id },
      data: updateBookDto,
    });
  }

  async delete(id: number) {
    await this.findOne(id);

    return this.prisma.book.delete({
      where: { id },
    });
  }
}
