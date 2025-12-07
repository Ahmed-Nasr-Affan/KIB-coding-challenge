import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { Movie } from '../database/entities/movie.entity';
import { Genre } from '../database/entities/genre.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { QueryMoviesDto } from './dto/query-movies.dto';
import { PaginatedMoviesResponseDto } from './dto/movie-response.dto';
import { CacheService } from '../cache/cache.service';

// Cache TTL in seconds
const CACHE_TTL_MOVIES_LIST = 300; // 5 minutes
const CACHE_TTL_MOVIE_DETAIL = 600; // 10 minutes
const CACHE_TTL_GENRES = 3600; // 1 hour

/**
 * Service for managing movies
 */
@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name);

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Find all movies with pagination, search, and filters
   */
  async findAll(queryDto: QueryMoviesDto): Promise<PaginatedMoviesResponseDto> {
    const cacheKey = `movies:list:${JSON.stringify(queryDto)}`;

    return await this.cacheService.getOrSet(
      cacheKey,
      () => this.fetchMovies(queryDto),
      CACHE_TTL_MOVIES_LIST,
    );
  }

  /**
   * Fetch movies from database (used by cache)
   */
  private async fetchMovies(queryDto: QueryMoviesDto): Promise<PaginatedMoviesResponseDto> {
    const { page = 1, limit = 20, search, genres, sortBy = 'popularity', sortOrder = 'DESC' } = queryDto;

    const queryBuilder = this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.genres', 'genre')
      .leftJoinAndSelect('movie.ratings', 'rating');

    // Search by title
    if (search) {
      queryBuilder.where('movie.title ILIKE :search', { search: `%${search}%` });
    }

    // Filter by genres
    if (genres) {
      const genreIds = genres.split(',').map(id => parseInt(id, 10));
      queryBuilder.andWhere('genre.id IN (:...genreIds)', { genreIds });
    }

    // Sorting
    const sortColumn = sortBy === 'releaseDate' ? 'movie.releaseDate' :
                      sortBy === 'voteAverage' ? 'movie.voteAverage' :
                      sortBy === 'title' ? 'movie.title' : 'movie.popularity';
    queryBuilder.orderBy(sortColumn, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [movies, total] = await queryBuilder.getManyAndCount();

    // Calculate average ratings
    const moviesWithRatings = movies.map(movie => ({
      ...movie,
      averageRating: this.calculateAverageRating(movie),
    }));

    return {
      data: moviesWithRatings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find one movie by ID
   */
  async findOne(id: number): Promise<Movie> {
    const cacheKey = `movies:detail:${id}`;

    const cachedMovie = await this.cacheService.get<Movie>(cacheKey);
    if (cachedMovie) {
      return cachedMovie;
    }

    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['genres', 'ratings'],
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    movie.averageRating = this.calculateAverageRating(movie);

    await this.cacheService.set(cacheKey, movie, CACHE_TTL_MOVIE_DETAIL);
    return movie;
  }

  /**
   * Create a new movie
   */
  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const { genreIds, ...movieData } = createMovieDto;

    let genres: Genre[] = [];
    if (genreIds && genreIds.length > 0) {
      genres = await this.genreRepository.findBy({ id: In(genreIds) });
    }

    const movie = this.movieRepository.create({
      ...movieData,
      genres,
    });

    const savedMovie = await this.movieRepository.save(movie);

    // Invalidate list cache on create
    await this.invalidateMoviesListCache();

    return savedMovie;
  }

  /**
   * Update an existing movie
   */
  async update(id: number, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    const movie = await this.movieRepository.findOne({
      where: { id },
      relations: ['genres', 'ratings'],
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    const { genreIds, ...movieData } = updateMovieDto;

    if (genreIds && genreIds.length > 0) {
      movie.genres = await this.genreRepository.findBy({ id: In(genreIds) });
    }

    Object.assign(movie, movieData);
    const updatedMovie = await this.movieRepository.save(movie);

    // Invalidate caches on update
    await this.cacheService.del(`movies:detail:${id}`);
    await this.invalidateMoviesListCache();

    return updatedMovie;
  }

  /**
   * Delete a movie
   */
  async remove(id: number): Promise<void> {
    const movie = await this.movieRepository.findOne({
      where: { id },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    await this.movieRepository.remove(movie);

    // Invalidate caches on delete
    await this.cacheService.del(`movies:detail:${id}`);
    await this.invalidateMoviesListCache();
  }

  /**
   * Invalidate movies list cache
   */
  private async invalidateMoviesListCache(): Promise<void> {
    // Since we can't use pattern matching easily, we'll reset the cache
    // In production, use Redis SCAN command for pattern-based invalidation
    this.logger.log('Invalidating movies list cache');
    await this.cacheService.reset();
  }

  /**
   * Calculate average rating for a movie
   */
  private calculateAverageRating(movie: Movie): number {
    if (!movie.ratings || movie.ratings.length === 0) {
      return 0;
    }

    const sum = movie.ratings.reduce((acc, rating) => acc + Number(rating.rating), 0);
    return Number((sum / movie.ratings.length).toFixed(1));
  }

  /**
   * Get all genres
   */
  async getAllGenres(): Promise<Genre[]> {
    const cacheKey = 'movies:genres';

    return await this.cacheService.getOrSet(
      cacheKey,
      () => this.genreRepository.find({ order: { name: 'ASC' } }),
      CACHE_TTL_GENRES,
    );
  }
}
