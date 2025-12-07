import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from '../database/entities/rating.entity';
import { Movie } from '../database/entities/movie.entity';
import { User } from '../database/entities/user.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { MovieRatingsResponseDto } from './dto/rating-response.dto';

/**
 * Service for managing movie ratings
 */
@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create or update a rating for a movie
   * @param userId User ID
   * @param movieId Movie ID
   * @param createRatingDto Rating data
   * @returns Created or updated rating
   */
  async rateMovie(userId: string, movieId: number, createRatingDto: CreateRatingDto): Promise<Rating> {
    // Verify movie exists
    const movie = await this.movieRepository.findOne({ where: { id: movieId } });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if user already rated this movie
    let rating = await this.ratingRepository.findOne({
      where: {
        user: { id: userId },
        movie: { id: movieId },
      },
    });

    if (rating) {
      // Update existing rating
      rating.rating = createRatingDto.rating;
      this.logger.log(`User ${userId} updated rating for movie ${movieId} to ${createRatingDto.rating}`);
    } else {
      // Create new rating
      rating = this.ratingRepository.create({
        rating: createRatingDto.rating,
        user,
        movie,
      });
      this.logger.log(`User ${userId} created rating for movie ${movieId}: ${createRatingDto.rating}`);
    }

    return await this.ratingRepository.save(rating);
  }

  /**
   * Get all ratings for a movie
   * @param movieId Movie ID
   * @returns Movie ratings with average
   */
  async getMovieRatings(movieId: number): Promise<MovieRatingsResponseDto> {
    const movie = await this.movieRepository.findOne({ where: { id: movieId } });
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    const ratings = await this.ratingRepository.find({
      where: { movie: { id: movieId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const averageRating = this.calculateAverageRating(ratings);

    return {
      movieId,
      averageRating,
      totalRatings: ratings.length,
      ratings: ratings.map(r => ({
        id: r.id,
        rating: Number(r.rating),
        userId: r.user.id,
        movieId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  }

  /**
   * Get user's rating for a specific movie
   * @param userId User ID
   * @param movieId Movie ID
   * @returns User's rating or null
   */
  async getUserMovieRating(userId: string, movieId: number): Promise<Rating | null> {
    return await this.ratingRepository.findOne({
      where: {
        user: { id: userId },
        movie: { id: movieId },
      },
    });
  }

  /**
   * Delete a rating
   * @param userId User ID
   * @param movieId Movie ID
   */
  async deleteRating(userId: string, movieId: number): Promise<void> {
    const rating = await this.ratingRepository.findOne({
      where: {
        user: { id: userId },
        movie: { id: movieId },
      },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    await this.ratingRepository.remove(rating);
    this.logger.log(`User ${userId} deleted rating for movie ${movieId}`);
  }

  /**
   * Calculate average rating from ratings array
   * @param ratings Array of ratings
   * @returns Average rating
   */
  private calculateAverageRating(ratings: Rating[]): number {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + Number(r.rating), 0);
    return Number((sum / ratings.length).toFixed(1));
  }

  /**
   * Get all ratings by a user
   * @param userId User ID
   * @returns User's ratings
   */
  async getUserRatings(userId: string): Promise<Rating[]> {
    return await this.ratingRepository.find({
      where: { user: { id: userId } },
      relations: ['movie'],
      order: { createdAt: 'DESC' },
    });
  }
}
