import { ApiProperty } from '@nestjs/swagger';

export class BookEntity {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier for the book',
  })
  id: number;

  @ApiProperty({
    example: 'The Great Gatsby',
    description: 'The title of the book',
  })
  title: string;

  @ApiProperty({
    example: 'F. Scott Fitzgerald',
    description: 'The author of the book',
  })
  author: string;

  @ApiProperty({
    example: 1925,
    description: 'The year the book was published',
    minimum: 1500,
    maximum: new Date().getFullYear(),
  })
  publicationYear: number;

  @ApiProperty({
    example: 'Fiction',
    description: 'The genre of the book',
  })
  genre: string;

  @ApiProperty({
    example: 10,
    description: 'The popularity score of the book, determined by review counts',
    minimum: 0,
  })
  popularity: number;

  @ApiProperty({
    example: 4.5,
    description: 'The average rating of the book, determined by user reviews',
    minimum: 1,
    maximum: 5,
  })
  rating: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'The timestamp when the book was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-02T00:00:00.000Z',
    description: 'The timestamp when the book was last updated',
  })
  updatedAt: Date;
}
