import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingResponseDto, MovieRatingsResponseDto } from './dto/rating-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('ratings')
@Controller('movies/:movieId/ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate a movie' })
  @ApiParam({ name: 'movieId', description: 'Movie ID' })
  @ApiResponse({ status: 201, description: 'Rating created/updated successfully', type: RatingResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie or user not found' })
  async rateMovie(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Body() createRatingDto: CreateRatingDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return await this.ratingsService.rateMovie(userId, movieId, createRatingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ratings for a movie' })
  @ApiParam({ name: 'movieId', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: 'Returns movie ratings', type: MovieRatingsResponseDto })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async getMovieRatings(
    @Param('movieId', ParseIntPipe) movieId: number,
  ): Promise<MovieRatingsResponseDto> {
    return await this.ratingsService.getMovieRatings(movieId);
  }

  @Get('my-rating')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's rating for a movie" })
  @ApiParam({ name: 'movieId', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: "Returns user's rating", type: RatingResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyRating(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return await this.ratingsService.getUserMovieRating(userId, movieId);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your rating for a movie' })
  @ApiParam({ name: 'movieId', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: 'Rating deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Rating not found' })
  async deleteRating(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    await this.ratingsService.deleteRating(userId, movieId);
    return { message: 'Rating deleted successfully' };
  }
}
