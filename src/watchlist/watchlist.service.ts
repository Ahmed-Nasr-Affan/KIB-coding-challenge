import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Watchlist } from '../database/entities/watchlist.entity';
import { Movie } from '../database/entities/movie.entity';
import { User } from '../database/entities/user.entity';
import { CreateWatchlistDto } from './dto/create-watchlist.dto';

/**
 * Service for managing user watchlists
 */
@Injectable()
export class WatchlistService {
  private readonly logger = new Logger(WatchlistService.name);

  constructor(
    @InjectRepository(Watchlist)
    private readonly watchlistRepository: Repository<Watchlist>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Add a movie to user's watchlist
   * @param userId User ID
   * @param movieId Movie ID
   * @param createWatchlistDto Watchlist data
   * @returns Created watchlist item
   */
  async addToWatchlist(
    userId: string,
    movieId: number,
    createWatchlistDto: CreateWatchlistDto,
  ): Promise<Watchlist> {
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

    // Check if already in watchlist
    const existing = await this.watchlistRepository.findOne({
      where: {
        user: { id: userId },
        movie: { id: movieId },
      },
    });

    if (existing) {
      throw new ConflictException('Movie is already in your watchlist');
    }

    const watchlistItem = this.watchlistRepository.create({
      user,
      movie,
      isFavorite: createWatchlistDto.isFavorite || false,
    });

    await this.watchlistRepository.save(watchlistItem);
    this.logger.log(`User ${userId} added movie ${movieId} to watchlist`);

    return watchlistItem;
  }

  /**
   * Get user's watchlist
   * @param userId User ID
   * @param favoritesOnly Filter favorites only
   * @returns User's watchlist
   */
  async getUserWatchlist(userId: string, favoritesOnly: boolean = false): Promise<Watchlist[]> {
    const queryBuilder = this.watchlistRepository
      .createQueryBuilder('watchlist')
      .leftJoinAndSelect('watchlist.movie', 'movie')
      .leftJoinAndSelect('movie.genres', 'genres')
      .where('watchlist.user_id = :userId', { userId })
      .orderBy('watchlist.createdAt', 'DESC');

    if (favoritesOnly) {
      queryBuilder.andWhere('watchlist.isFavorite = :isFavorite', { isFavorite: true });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Remove a movie from watchlist
   * @param userId User ID
   * @param movieId Movie ID
   */
  async removeFromWatchlist(userId: string, movieId: number): Promise<void> {
    const watchlistItem = await this.watchlistRepository.findOne({
      where: {
        user: { id: userId },
        movie: { id: movieId },
      },
    });

    if (!watchlistItem) {
      throw new NotFoundException('Movie not found in your watchlist');
    }

    await this.watchlistRepository.remove(watchlistItem);
    this.logger.log(`User ${userId} removed movie ${movieId} from watchlist`);
  }

  /**
   * Toggle favorite status for a movie in watchlist
   * @param userId User ID
   * @param movieId Movie ID
   * @returns Updated watchlist item
   */
  async toggleFavorite(userId: string, movieId: number): Promise<Watchlist> {
    const watchlistItem = await this.watchlistRepository.findOne({
      where: {
        user: { id: userId },
        movie: { id: movieId },
      },
      relations: ['movie'],
    });

    if (!watchlistItem) {
      throw new NotFoundException('Movie not found in your watchlist');
    }

    watchlistItem.isFavorite = !watchlistItem.isFavorite;
    await this.watchlistRepository.save(watchlistItem);

    this.logger.log(
      `User ${userId} ${watchlistItem.isFavorite ? 'marked' : 'unmarked'} movie ${movieId} as favorite`,
    );

    return watchlistItem;
  }

  /**
   * Check if a movie is in user's watchlist
   * @param userId User ID
   * @param movieId Movie ID
   * @returns True if in watchlist, false otherwise
   */
  async isInWatchlist(userId: string, movieId: number): Promise<boolean> {
    const count = await this.watchlistRepository.count({
      where: {
        user: { id: userId },
        movie: { id: movieId },
      },
    });

    return count > 0;
  }

  /**
   * Get user's favorites
   * @param userId User ID
   * @returns User's favorite movies
   */
  async getUserFavorites(userId: string): Promise<Watchlist[]> {
    return await this.getUserWatchlist(userId, true);
  }
}
