import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { randomUUID } from 'crypto';
import { BooksService } from 'src/books/books.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly booksService: BooksService,
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

  async create(userId: number, createReviewDto: CreateReviewDto) {
    const eventId = randomUUID();
    this.logSuccess('Creating a new review', eventId, userId, {
      createReviewDto,
    });

    try {
      const { userId: dtoUserId, bookId, ...rest } = createReviewDto;

      const review = await this.prisma.review.create({
        data: {
          ...rest,
          user: { connect: { id: dtoUserId } },
          book: { connect: { id: bookId } },
        },
      });

      const newRating = await this.booksService.calculateBookRating(bookId);
      await this.prisma.book.update({
        where: { id: bookId },
        data: { rating: newRating },
      });

      const newPopularity =
        await this.booksService.calculateBookPopularity(bookId);
      await this.prisma.book.update({
        where: { id: bookId },
        data: { popularity: newPopularity },
      });

      this.logSuccess(
        'Review created successfully and book data updated',
        eventId,
        userId,
        {
          reviewId: review.id,
          bookId,
          newRating,
        },
      );

      return review;
    } catch (error) {
      this.logError('Error creating review', eventId, userId, error);
      throw new InternalServerErrorException('Failed to create review');
    }
  }

  async findAll(userId: number) {
    const eventId = randomUUID();
    this.logSuccess('Fetching all reviews', eventId, userId);

    try {
      const reviews = await this.prisma.review.findMany({
        include: {
          user: true,
          book: true,
        },
      });

      this.logSuccess('Reviews fetched successfully', eventId, userId, {
        count: reviews.length,
      });
      return reviews;
    } catch (error) {
      this.logError('Error fetching reviews', eventId, userId, error);
      throw new InternalServerErrorException('Failed to fetch reviews');
    }
  }

  async findOne(userId: number, id: number) {
    const eventId = randomUUID();
    this.logSuccess(`Fetching review with ID: ${id}`, eventId, userId);

    try {
      const review = await this.prisma.review.findUnique({
        where: { id },
        include: {
          user: true,
          book: true,
        },
      });

      if (!review) {
        this.logger.warn(`Review with ID ${id} not found`, { userId, eventId });
        throw new NotFoundException(`Review with ID ${id} not found`);
      }

      this.logSuccess('Review fetched successfully', eventId, userId, {
        reviewId: id,
      });
      return review;
    } catch (error) {
      this.logError('Error fetching review', eventId, userId, error);
      throw new InternalServerErrorException(
        `Failed to fetch review with ID ${id}`,
      );
    }
  }

  async update(userId: number, id: number, updateReviewDto: UpdateReviewDto) {
    const eventId = randomUUID();
    this.logSuccess(`Updating review with ID: ${id}`, eventId, userId, {
      updateReviewDto,
    });

    const { userId: dtoUserId, bookId: dtoBookId, ...rest } = updateReviewDto;

    const data: any = {
      ...rest,
    };

    if (dtoUserId) {
      data.user = { connect: { id: dtoUserId } };
    }

    if (dtoBookId) {
      data.book = { connect: { id: dtoBookId } };
    }

    try {
      const updatedReview = await this.prisma.review.update({
        where: { id },
        data,
      });

      this.logSuccess('Review updated successfully', eventId, userId, {
        reviewId: id,
      });
      return updatedReview;
    } catch (error) {
      this.logError('Error updating review', eventId, userId, error);
      throw new InternalServerErrorException(
        `Failed to update review with ID ${id}`,
      );
    }
  }

  async remove(userId: number, id: number) {
    const eventId = randomUUID();
    this.logSuccess(`Deleting review with ID: ${id}`, eventId, userId);

    try {
      const existingReview = await this.findOne(userId, id);
      await this.prisma.review.delete({ where: { id: existingReview.id } });

      const newPopularity = await this.booksService.calculateBookPopularity(
        existingReview.bookId,
      );
      const newRating = await this.booksService.calculateBookRating(
        existingReview.bookId,
      );

      await this.prisma.book.update({
        where: { id: existingReview.bookId },
        data: { popularity: newPopularity, rating: newRating },
      });

      this.logSuccess(
        'Review deleted successfully and book data updated',
        eventId,
        userId,
        {
          reviewId: id,
          bookId: existingReview.bookId,
          newPopularity,
        },
      );

      return { message: `Review with ID ${id} deleted successfully` };
    } catch (error) {
      this.logError('Error deleting review', eventId, userId, error);
      throw new InternalServerErrorException(
        `Failed to delete review with ID ${id}`,
      );
    }
  }
}
