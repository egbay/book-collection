import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

describe('ReviewsController', () => {
  let controller: ReviewsController;

  const mockReviewsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: mockReviewsService,
        },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createReview', () => {
    it('should create a new review', async () => {
      const createReviewDto: CreateReviewDto = {
        userId: 1,
        bookId: 1,
        content: 'This book is amazing!',
        rating: 5,
      };
      const userId = 1;

      mockReviewsService.create.mockResolvedValue('Review created');
      const result = await controller.createReview(
        { user: { userId } },
        createReviewDto,
      );

      expect(result).toEqual('Review created');
      expect(mockReviewsService.create).toHaveBeenCalledWith(
        userId,
        createReviewDto,
      );
    });

    it('should throw an error when service fails', async () => {
      const createReviewDto: CreateReviewDto = {
        userId: 1,
        bookId: 1,
        content: 'This book is amazing!',
        rating: 5,
      };
      const userId = 1;

      mockReviewsService.create.mockRejectedValue(
        new Error('Failed to create review'),
      );

      await expect(
        controller.createReview({ user: { userId } }, createReviewDto),
      ).rejects.toThrow('Failed to create review');
    });

    it('should throw an error for invalid rating', async () => {
      const createReviewDto: CreateReviewDto = {
        userId: 1,
        bookId: 1,
        content: 'Invalid rating',
        rating: 6,
      };
      const userId = 1;

      await expect(
        controller.createReview({ user: { userId } }, createReviewDto),
      ).rejects.toThrow();
    });
  });

  describe('getAllReviews', () => {
    it('should return all reviews for a user', async () => {
      const userId = 1;
      const mockReviews = [{ id: 1, content: 'Great book!', rating: 5 }];
      mockReviewsService.findAll.mockResolvedValue(mockReviews);

      const result = await controller.getAllReviews({ user: { userId } });

      expect(result).toEqual(mockReviews);
      expect(mockReviewsService.findAll).toHaveBeenCalledWith(userId);
    });

    it('should return an empty array if no reviews exist', async () => {
      const userId = 1;
      mockReviewsService.findAll.mockResolvedValue([]);

      const result = await controller.getAllReviews({ user: { userId } });

      expect(result).toEqual([]);
    });
  });

  describe('getReviewById', () => {
    it('should return a single review by ID', async () => {
      const userId = 1;
      const reviewId = 1;
      const mockReview = { id: reviewId, content: 'Great book!', rating: 5 };

      mockReviewsService.findOne.mockResolvedValue(mockReview);
      const result = await controller.getReviewById(
        { user: { userId } },
        reviewId.toString(),
      );

      expect(result).toEqual(mockReview);
      expect(mockReviewsService.findOne).toHaveBeenCalledWith(userId, reviewId);
    });

    it('should throw a 404 error if review not found', async () => {
      const userId = 1;
      const reviewId = 1;

      mockReviewsService.findOne.mockResolvedValue(null);

      await expect(
        controller.getReviewById({ user: { userId } }, reviewId.toString()),
      ).rejects.toThrow();
    });
  });

  describe('updateReview', () => {
    it('should update a review by ID', async () => {
      const userId = 1;
      const reviewId = 1;
      const updateReviewDto: UpdateReviewDto = {
        content: 'Updated content',
        rating: 4,
      };

      mockReviewsService.update.mockResolvedValue('Review updated');
      const result = await controller.updateReview(
        { user: { userId } },
        reviewId.toString(),
        updateReviewDto,
      );

      expect(result).toEqual('Review updated');
      expect(mockReviewsService.update).toHaveBeenCalledWith(
        userId,
        reviewId,
        updateReviewDto,
      );
    });

    it('should throw an error if review not found during update', async () => {
      const userId = 1;
      const reviewId = 1;
      const updateReviewDto: UpdateReviewDto = {
        content: 'Updated content',
        rating: 4,
      };

      mockReviewsService.update.mockRejectedValue(
        new Error('Review not found'),
      );

      await expect(
        controller.updateReview(
          { user: { userId } },
          reviewId.toString(),
          updateReviewDto,
        ),
      ).rejects.toThrow('Review not found');
    });
  });

  describe('deleteReview', () => {
    it('should delete a review by ID', async () => {
      const userId = 1;
      const reviewId = 1;

      mockReviewsService.remove.mockResolvedValue('Review deleted');
      const result = await controller.deleteReview(
        { user: { userId } },
        reviewId.toString(),
      );

      expect(result).toEqual('Review deleted');
      expect(mockReviewsService.remove).toHaveBeenCalledWith(userId, reviewId);
    });

    it('should throw an error if review not found during deletion', async () => {
      const userId = 1;
      const reviewId = 1;

      mockReviewsService.remove.mockRejectedValue(
        new Error('Review not found'),
      );

      await expect(
        controller.deleteReview({ user: { userId } }, reviewId.toString()),
      ).rejects.toThrow('Review not found');
    });
  });
});
