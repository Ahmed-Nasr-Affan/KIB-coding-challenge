import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TmdbService } from '../../tmdb/tmdb.service';
import { Movie } from '../entities/movie.entity';
import { Genre } from '../entities/genre.entity';
import { TmdbMovie } from '../../tmdb/interfaces/tmdb.interface';

/**
 * Service for seeding the database with TMDB data
 */
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly tmdbService: TmdbService,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  /**
   * Seed genres from TMDB
   */
  async seedGenres(): Promise<void> {
    this.logger.log('Starting genre seeding...');
    try {
      const tmdbGenres = await this.tmdbService.getGenres();

      for (const tmdbGenre of tmdbGenres.genres) {
        const existingGenre = await this.genreRepository.findOne({
          where: { id: tmdbGenre.id },
        });

        if (!existingGenre) {
          await this.genreRepository.save({
            id: tmdbGenre.id,
            name: tmdbGenre.name,
          });
        }
      }

      this.logger.log(`Successfully seeded ${tmdbGenres.genres.length} genres`);
    } catch (error) {
      this.logger.error(`Failed to seed genres: ${error.message}`);
      throw error;
    }
  }

  /**
   * Seed movies from TMDB
   * @param totalPages Number of pages to fetch
   */
  async seedMovies(totalPages: number = 10): Promise<void> {
    this.logger.log(`Starting movie seeding for ${totalPages} pages...`);
    let movieCount = 0;

    try {
      for (let page = 1; page <= totalPages; page++) {
        const [popular, topRated, nowPlaying] = await Promise.all([
          this.tmdbService.getPopularMovies(page),
          this.tmdbService.getTopRatedMovies(page),
          this.tmdbService.getNowPlayingMovies(page),
        ]);

        const allMovies = [...popular.results, ...topRated.results, ...nowPlaying.results];
        const uniqueMovies = Array.from(new Map(allMovies.map((m) => [m.id, m])).values());

        for (const tmdbMovie of uniqueMovies) {
          await this.saveMovie(tmdbMovie);
          movieCount++;
        }

        this.logger.log(`Processed page ${page}/${totalPages} - Total movies: ${movieCount}`);
      }

      this.logger.log(`Successfully seeded ${movieCount} movies`);
    } catch (error) {
      this.logger.error(`Failed to seed movies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save a single movie to the database
   * @param tmdbMovie TMDB movie data
   */
  private async saveMovie(tmdbMovie: TmdbMovie): Promise<void> {
    try {
      const existingMovie = await this.movieRepository.findOne({
        where: { id: tmdbMovie.id },
      });

      const genres = await this.genreRepository.findByIds(tmdbMovie.genre_ids || []);

      const movieData: Partial<Movie> = {
        id: tmdbMovie.id,
        title: tmdbMovie.title,
        overview: tmdbMovie.overview,
        posterPath: tmdbMovie.poster_path,
        backdropPath: tmdbMovie.backdrop_path,
        releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : undefined,
        voteAverage: tmdbMovie.vote_average,
        voteCount: tmdbMovie.vote_count,
        popularity: tmdbMovie.popularity,
        adult: tmdbMovie.adult,
        originalLanguage: tmdbMovie.original_language,
        originalTitle: tmdbMovie.original_title,
        genres,
      };

      if (existingMovie) {
        await this.movieRepository.update(tmdbMovie.id, movieData);
      } else {
        await this.movieRepository.save(movieData as Movie);
      }
    } catch (error) {
      this.logger.error(`Failed to save movie ${tmdbMovie.id}: ${error.message}`);
    }
  }

  /**
   * Run full database seeding
   */
  async runSeed(): Promise<void> {
    this.logger.log('Starting full database seed...');
    await this.seedGenres();
    await this.seedMovies(10);
    this.logger.log('Database seeding completed successfully!');
  }
}
