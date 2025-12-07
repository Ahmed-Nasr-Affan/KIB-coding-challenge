import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TmdbMovieResponse, TmdbGenreResponse, TmdbMovie } from './interfaces/tmdb.interface';

/**
 * Service for interacting with The Movie Database (TMDB) API
 */
@Injectable()
export class TmdbService {
  private readonly logger = new Logger(TmdbService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('TMDB_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('TMDB_BASE_URL') || 'https://api.themoviedb.org/3';
  }

  /**
   * Fetch popular movies from TMDB
   * @param page Page number for pagination
   * @returns Promise with movie data
   */
  async getPopularMovies(page: number = 1): Promise<TmdbMovieResponse> {
    try {
      const url = `${this.baseUrl}/movie/popular`;
      const response = await firstValueFrom(
        this.httpService.get<TmdbMovieResponse>(url, {
          params: {
            api_key: this.apiKey,
            page,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch popular movies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch top rated movies from TMDB
   * @param page Page number for pagination
   * @returns Promise with movie data
   */
  async getTopRatedMovies(page: number = 1): Promise<TmdbMovieResponse> {
    try {
      const url = `${this.baseUrl}/movie/top_rated`;
      const response = await firstValueFrom(
        this.httpService.get<TmdbMovieResponse>(url, {
          params: {
            api_key: this.apiKey,
            page,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch top rated movies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch now playing movies from TMDB
   * @param page Page number for pagination
   * @returns Promise with movie data
   */
  async getNowPlayingMovies(page: number = 1): Promise<TmdbMovieResponse> {
    try {
      const url = `${this.baseUrl}/movie/now_playing`;
      const response = await firstValueFrom(
        this.httpService.get<TmdbMovieResponse>(url, {
          params: {
            api_key: this.apiKey,
            page,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch now playing movies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch movie details by ID from TMDB
   * @param movieId TMDB movie ID
   * @returns Promise with movie details
   */
  async getMovieDetails(movieId: number): Promise<TmdbMovie> {
    try {
      const url = `${this.baseUrl}/movie/${movieId}`;
      const response = await firstValueFrom(
        this.httpService.get<TmdbMovie>(url, {
          params: {
            api_key: this.apiKey,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch movie details for ${movieId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch all genres from TMDB
   * @returns Promise with genre data
   */
  async getGenres(): Promise<TmdbGenreResponse> {
    try {
      const url = `${this.baseUrl}/genre/movie/list`;
      const response = await firstValueFrom(
        this.httpService.get<TmdbGenreResponse>(url, {
          params: {
            api_key: this.apiKey,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch genres: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search movies by query
   * @param query Search query
   * @param page Page number for pagination
   * @returns Promise with movie data
   */
  async searchMovies(query: string, page: number = 1): Promise<TmdbMovieResponse> {
    try {
      const url = `${this.baseUrl}/search/movie`;
      const response = await firstValueFrom(
        this.httpService.get<TmdbMovieResponse>(url, {
          params: {
            api_key: this.apiKey,
            query,
            page,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to search movies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Discover movies by genre
   * @param genreId Genre ID
   * @param page Page number for pagination
   * @returns Promise with movie data
   */
  async discoverByGenre(genreId: number, page: number = 1): Promise<TmdbMovieResponse> {
    try {
      const url = `${this.baseUrl}/discover/movie`;
      const response = await firstValueFrom(
        this.httpService.get<TmdbMovieResponse>(url, {
          params: {
            api_key: this.apiKey,
            with_genres: genreId,
            page,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to discover movies by genre: ${error.message}`);
      throw error;
    }
  }
}
