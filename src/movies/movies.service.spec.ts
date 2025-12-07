import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { Movie } from '../database/entities/movie.entity';
import { Genre } from '../database/entities/genre.entity';
import { CacheService } from '../cache/cache.service';

describe('MoviesService', () => {
  let service: MoviesService;
  let movieRepository: Repository<Movie>;
  let genreRepository: Repository<Genre>;
  let cacheService: CacheService;

  const mockMovie = {
    id: 1,
    title: 'Test Movie',
    overview: 'Test overview',
    posterPath: '/test.jpg',
    backdropPath: '/backdrop.jpg',
    releaseDate: new Date('2023-01-01'),
    voteAverage: 8.5,
    voteCount: 100,
    popularity: 50.5,
    adult: false,
    originalLanguage: 'en',
    originalTitle: 'Test Movie',
    genres: [{ id: 28, name: 'Action' }],
    ratings: [{ rating: 8.5 }, { rating: 7.5 }],
  };

  const mockGenre = { id: 28, name: 'Action' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        {
          provide: getRepositoryToken(Movie),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[mockMovie], 1]),
            })),
          },
        },
        {
          provide: getRepositoryToken(Genre),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findBy: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
            reset: jest.fn().mockResolvedValue(undefined),
            getOrSet: jest.fn().mockImplementation((key, factory) => factory()),
          },
        },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    movieRepository = module.get<Repository<Movie>>(getRepositoryToken(Movie));
    genreRepository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated movies', async () => {
      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should return movies with average rating', async () => {
      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data[0].averageRating).toBe(8);
    });
  });

  describe('findOne', () => {
    it('should return a movie by ID', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovie as Movie);

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Movie');
      expect(result.averageRating).toBe(8);
    });

    it('should throw NotFoundException when movie not found', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new movie', async () => {
      const createMovieDto = {
        id: 1,
        title: 'New Movie',
        overview: 'New overview',
        genreIds: [28],
      };

      jest.spyOn(genreRepository, 'findBy').mockResolvedValue([mockGenre as Genre]);
      jest.spyOn(movieRepository, 'create').mockReturnValue(mockMovie as Movie);
      jest.spyOn(movieRepository, 'save').mockResolvedValue(mockMovie as Movie);

      const result = await service.create(createMovieDto as any);

      expect(result).toBeDefined();
      expect(movieRepository.create).toHaveBeenCalled();
      expect(movieRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing movie', async () => {
      const updateMovieDto = { title: 'Updated Movie' };

      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovie as Movie);
      jest.spyOn(movieRepository, 'save').mockResolvedValue({ ...mockMovie, title: 'Updated Movie' } as Movie);

      const result = await service.update(1, updateMovieDto);

      expect(result).toBeDefined();
      expect(movieRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when movie not found', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update(999, { title: 'Updated' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a movie', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovie as Movie);
      jest.spyOn(movieRepository, 'remove').mockResolvedValue(mockMovie as Movie);

      await service.remove(1);

      expect(movieRepository.remove).toHaveBeenCalledWith(mockMovie);
    });

    it('should throw NotFoundException when movie not found', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllGenres', () => {
    it('should return all genres', async () => {
      const mockGenres = [mockGenre];
      jest.spyOn(genreRepository, 'find').mockResolvedValue(mockGenres as Genre[]);

      const result = await service.getAllGenres();

      expect(result).toEqual(mockGenres);
      expect(genreRepository.find).toHaveBeenCalled();
    });
  });
});
