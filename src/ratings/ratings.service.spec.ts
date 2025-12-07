import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { Rating } from '../database/entities/rating.entity';
import { Movie } from '../database/entities/movie.entity';
import { User } from '../database/entities/user.entity';

describe('RatingsService', () => {
  let service: RatingsService;
  let ratingRepository: Repository<Rating>;
  let movieRepository: Repository<Movie>;
  let userRepository: Repository<User>;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockMovie = {
    id: 1,
    title: 'Test Movie',
  };

  const mockRating = {
    id: 'rating-1',
    rating: 8.5,
    user: mockUser,
    movie: mockMovie,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: getRepositoryToken(Rating),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
    ratingRepository = module.get<Repository<Rating>>(getRepositoryToken(Rating));
    movieRepository = module.get<Repository<Movie>>(getRepositoryToken(Movie));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('rateMovie', () => {
    it('should create a new rating', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovie as Movie);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(ratingRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(ratingRepository, 'create').mockReturnValue(mockRating as Rating);
      jest.spyOn(ratingRepository, 'save').mockResolvedValue(mockRating as Rating);

      const result = await service.rateMovie('user-1', 1, { rating: 8.5 });

      expect(result).toBeDefined();
      expect(ratingRepository.create).toHaveBeenCalled();
      expect(ratingRepository.save).toHaveBeenCalled();
    });

    it('should update existing rating', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovie as Movie);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(ratingRepository, 'findOne').mockResolvedValue(mockRating as Rating);
      jest.spyOn(ratingRepository, 'save').mockResolvedValue({ ...mockRating, rating: 9.0 } as Rating);

      const result = await service.rateMovie('user-1', 1, { rating: 9.0 });

      expect(result).toBeDefined();
      expect(ratingRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when movie not found', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(null);

      await expect(service.rateMovie('user-1', 999, { rating: 8.5 })).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovie as Movie);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.rateMovie('user-999', 1, { rating: 8.5 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('getMovieRatings', () => {
    it('should return movie ratings with average', async () => {
      const mockRatings = [
        { ...mockRating, rating: 8.5 },
        { ...mockRating, rating: 7.5 },
      ];

      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovie as Movie);
      jest.spyOn(ratingRepository, 'find').mockResolvedValue(mockRatings as Rating[]);

      const result = await service.getMovieRatings(1);

      expect(result).toBeDefined();
      expect(result.movieId).toBe(1);
      expect(result.averageRating).toBe(8);
      expect(result.totalRatings).toBe(2);
    });

    it('should throw NotFoundException when movie not found', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getMovieRatings(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserMovieRating', () => {
    it('should return user rating for a movie', async () => {
      jest.spyOn(ratingRepository, 'findOne').mockResolvedValue(mockRating as Rating);

      const result = await service.getUserMovieRating('user-1', 1);

      expect(result).toBeDefined();
      expect(result!.id).toBe('rating-1');
    });

    it('should return null when rating not found', async () => {
      jest.spyOn(ratingRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getUserMovieRating('user-1', 1);

      expect(result).toBeNull();
    });
  });

  describe('deleteRating', () => {
    it('should delete a rating', async () => {
      jest.spyOn(ratingRepository, 'findOne').mockResolvedValue(mockRating as Rating);
      jest.spyOn(ratingRepository, 'remove').mockResolvedValue(mockRating as Rating);

      await service.deleteRating('user-1', 1);

      expect(ratingRepository.remove).toHaveBeenCalledWith(mockRating);
    });

    it('should throw NotFoundException when rating not found', async () => {
      jest.spyOn(ratingRepository, 'findOne').mockResolvedValue(null);

      await expect(service.deleteRating('user-1', 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserRatings', () => {
    it('should return all ratings by a user', async () => {
      const mockRatings = [mockRating];
      jest.spyOn(ratingRepository, 'find').mockResolvedValue(mockRatings as Rating[]);

      const result = await service.getUserRatings('user-1');

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
    });
  });
});
