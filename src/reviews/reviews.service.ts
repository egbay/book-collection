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
import { logSuccess, logError, logWarn } from '../utils/logger.util';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly booksService: BooksService,
  ) {}

  async create(userId: number, createReviewDto: CreateReviewDto) {
    const eventId = randomUUID();
    logSuccess(this.logger, 'Creating a new review', eventId, userId, {
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
      const newPopularity =
        await this.booksService.calculateBookPopularity(bookId);

      await this.prisma.book.update({
        where: { id: bookId },
        data: { rating: newRating, popularity: newPopularity },
      });

      logSuccess(this.logger, 'Review created successfully', eventId, userId, {
        reviewId: review.id,
        bookId,
        newRating,
        newPopularity,
      });

      return review;
    } catch (error) {
      logError(this.logger, 'Error creating review', eventId, userId, error);
      throw new InternalServerErrorException('Failed to create review');
    }
  }

  async findAll(userId: number) {
    const eventId = randomUUID();
    logSuccess(this.logger, 'Fetching all reviews', eventId, userId, {});

    try {
      const reviews = await this.prisma.review.findMany({
        include: { user: true, book: true },
      });

      logSuccess(this.logger, 'Reviews fetched successfully', eventId, userId, {
        count: reviews.length,
      });
      return reviews;
    } catch (error) {
      logError(this.logger, 'Error fetching reviews', eventId, userId, error);
      throw new InternalServerErrorException('Failed to fetch reviews');
    }
  }

  async findOne(userId: number, id: number) {
    const eventId = randomUUID();
    logSuccess(this.logger, `Fetching review with ID: ${id}`, eventId, userId, {
      id,
    });

    try {
      const review = await this.prisma.review.findUnique({
        where: { id },
        include: { user: true, book: true },
      });

      if (!review) {
        logWarn(
          this.logger,
          `Review with ID ${id} not found`,
          eventId,
          userId,
          {
            id,
          },
        );
        throw new NotFoundException(`Review with ID ${id} not found`);
      }

      logSuccess(this.logger, 'Review fetched successfully', eventId, userId, {
        reviewId: id,
      });

      return review;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      logError(this.logger, 'Error fetching review', eventId, userId, error);
      throw new InternalServerErrorException(
        `Failed to fetch review with ID ${id}`,
      );
    }
  }

  async update(userId: number, id: number, updateReviewDto: UpdateReviewDto) {
    const eventId = randomUUID();
    logSuccess(this.logger, `Updating review with ID: ${id}`, eventId, userId, {
      updateReviewDto,
    });

    const { userId: dtoUserId, bookId: dtoBookId, ...rest } = updateReviewDto;

    try {
      const updatedReview = await this.prisma.review.update({
        where: { id },
        data: {
          ...rest,
          ...(dtoUserId && { user: { connect: { id: dtoUserId } } }),
          ...(dtoBookId && { book: { connect: { id: dtoBookId } } }),
        },
      });

      logSuccess(this.logger, 'Review updated successfully', eventId, userId, {
        reviewId: id,
      });

      return updatedReview;
    } catch (error) {
      logError(this.logger, 'Error updating review', eventId, userId, error);
      throw new InternalServerErrorException(
        `Failed to update review with ID ${id}`,
      );
    }
  }

  async remove(userId: number, id: number) {
    const eventId = randomUUID();
    logSuccess(this.logger, `Deleting review with ID: ${id}`, eventId, userId, {
      id,
    });

    try {
      const existingReview = await this.findOne(userId, id);

      await this.prisma.review.delete({ where: { id: existingReview.id } });

      const [newPopularity, newRating] = await Promise.all([
        this.booksService.calculateBookPopularity(existingReview.bookId),
        this.booksService.calculateBookRating(existingReview.bookId),
      ]);

      await this.prisma.book.update({
        where: { id: existingReview.bookId },
        data: { popularity: newPopularity, rating: newRating },
      });

      logSuccess(
        this.logger,
        'Review deleted successfully and book data updated',
        eventId,
        userId,
        {
          reviewId: id,
          bookId: existingReview.bookId,
          newPopularity,
          newRating,
        },
      );

      return { message: `Review with ID ${id} deleted successfully` };
    } catch (error) {
      logError(this.logger, 'Error deleting review', eventId, userId, error);
      throw new InternalServerErrorException(
        `Failed to delete review with ID ${id}`,
      );
    }
  }
}
