import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBody({
    description: 'The data needed to create a new review',
    type: CreateReviewDto,
    examples: {
      example1: {
        summary: 'Valid Review',
        value: {
          userId: 1,
          bookId: 1,
          content: 'This book is amazing!',
          rating: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Review successfully created.',
  })
  async createReview(@Req() req, @Body() createReviewDto: CreateReviewDto) {
    const userId = req.user.userId;
    return this.reviewsService.create(userId, createReviewDto);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List of all reviews.',
  })
  async getAllReviews(@Req() req) {
    const userId = req.user.userId;
    return this.reviewsService.findAll(userId);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'The ID of the review to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'Review details.',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found.',
  })
  async getReviewById(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.reviewsService.findOne(userId, +id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'The ID of the review to update',
  })
  @ApiBody({
    description: 'The data needed to update an existing review',
    type: UpdateReviewDto,
    examples: {
      example1: {
        summary: 'Valid Update',
        value: {
          content: 'Updated review content.',
          rating: 4,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Review successfully updated.',
  })
  async updateReview(
    @Req() req,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    const userId = req.user.userId;
    return this.reviewsService.update(userId, +id, updateReviewDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    example: 1,
    description: 'The ID of the review to delete',
  })
  @ApiResponse({
    status: 200,
    description: 'Review successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Review not found.',
  })
  async deleteReview(@Req() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.reviewsService.remove(userId, +id);
  }
}
