import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../auth/entities/user.entity';
import { BookEntity } from '../../books/entities/book.entity';

export class ReviewEntity {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier for the review',
  })
  id: number;

  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the user who created the review',
  })
  userId: number;

  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the book being reviewed',
  })
  bookId: number;

  @ApiProperty({
    example: 'This is an amazing book!',
    description: 'The content of the review',
  })
  content: string;

  @ApiProperty({
    example: 5,
    description: 'The rating given to the book, on a scale of 1 to 5',
    minimum: 1,
    maximum: 5,
  })
  rating: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'The timestamp when the review was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-02T00:00:00.000Z',
    description: 'The timestamp when the review was last updated',
  })
  updatedAt: Date;

  @ApiProperty({
    type: () => BookEntity,
    description: 'The book being reviewed (relation)',
    nullable: true,
  })
  book?: BookEntity;

  @ApiProperty({
    type: () => UserEntity,
    description: 'The user who created the review (relation)',
    nullable: true,
  })
  user?: UserEntity;
}
