import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BooksService } from 'src/books/books.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { mock } from 'jest-mock-extended';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prismaMock: any;
  let booksServiceMock: jest.Mocked<BooksService>;
  let loggerMock: jest.Mocked<any>;

  beforeEach(async () => {
    prismaMock = {
      review: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      book: {
        update: jest.fn(),
      },
    };

    booksServiceMock = mock<BooksService>();
    loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: BooksService, useValue: booksServiceMock },
        { provide: WINSTON_MODULE_PROVIDER, useValue: loggerMock },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new review and update book data', async () => {
      const createReviewDto = {
        userId: 1,
        bookId: 1,
        content: 'Great book!',
        rating: 5,
      };

      const newReview = {
        id: 1,
        ...createReviewDto,
      };

      prismaMock.review.create.mockResolvedValue(newReview);
      booksServiceMock.calculateBookRating.mockResolvedValue(4.5);
      booksServiceMock.calculateBookPopularity.mockResolvedValue(10);
      prismaMock.book.update.mockResolvedValue({});

      const result = await service.create(1, createReviewDto);

      expect(result).toEqual(newReview);
      expect(prismaMock.review.create).toHaveBeenCalledWith({
        data: {
          content: 'Great book!',
          rating: 5,
          user: { connect: { id: 1 } },
          book: { connect: { id: 1 } },
        },
      });
      expect(booksServiceMock.calculateBookRating).toHaveBeenCalledWith(1);
      expect(booksServiceMock.calculateBookPopularity).toHaveBeenCalledWith(1);
    });
  });

  describe('findAll', () => {
    it('should return all reviews', async () => {
      const reviews = [{ id: 1, content: 'Review 1', rating: 5 }];

      prismaMock.review.findMany.mockResolvedValue(reviews);

      const result = await service.findAll(1);

      expect(result).toEqual(reviews);
      expect(prismaMock.review.findMany).toHaveBeenCalledWith({
        include: { user: true, book: true },
      });
    });

    it('should handle errors gracefully', async () => {
      prismaMock.review.findMany.mockRejectedValue(new Error('Fetch error'));

      await expect(service.findAll(1)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single review', async () => {
      const review = { id: 1, content: 'Great review', rating: 5 };

      prismaMock.review.findUnique.mockResolvedValue(review);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(review);
      expect(prismaMock.review.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { user: true, book: true },
      });
    });

    it('should throw NotFoundException if review is not found', async () => {
      prismaMock.review.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1, 1)).rejects.toThrow(NotFoundException);
      expect(loggerMock.warn).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a review', async () => {
      const updateReviewDto = { content: 'Updated content', rating: 4 };
      const updatedReview = { id: 1, ...updateReviewDto };

      prismaMock.review.update.mockResolvedValue(updatedReview);

      const result = await service.update(1, 1, updateReviewDto);

      expect(result).toEqual(updatedReview);
      expect(prismaMock.review.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateReviewDto,
      });
    });

    it('should handle errors gracefully', async () => {
      prismaMock.review.update.mockRejectedValue(new Error('Update error'));

      await expect(service.update(1, 1, {})).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a review and update book data', async () => {
      const review = { id: 1, bookId: 1, content: 'Review', rating: 5 };

      prismaMock.review.findUnique.mockResolvedValue(review);
      prismaMock.review.delete.mockResolvedValue(review);
      booksServiceMock.calculateBookPopularity.mockResolvedValue(90);
      booksServiceMock.calculateBookRating.mockResolvedValue(4.5);
      prismaMock.book.update.mockResolvedValue({});

      const result = await service.remove(1, 1);

      expect(result).toEqual({
        message: `Review with ID 1 deleted successfully`,
      });
      expect(prismaMock.review.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should handle errors gracefully', async () => {
      prismaMock.review.findUnique.mockRejectedValue(new Error('Delete error'));

      await expect(service.remove(1, 1)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(loggerMock.error).toHaveBeenCalled();
    });
  });
});
