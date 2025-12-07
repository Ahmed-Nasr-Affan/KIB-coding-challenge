import { Test, TestingModule } from '@nestjs/testing';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { NotFoundException } from '@nestjs/common';

describe('RatingsController', () => {
  let controller: RatingsController;
  let service: RatingsService;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@test.com',
  };

  const mockRating = {
    id: 'rating-123',
    rating: 8.5,
    userId: 'user-123',
    movieId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMovieRatings = {
    movieId: 1,
    averageRating: 8,
    totalRatings: 2,
    ratings: [mockRating],
  };

  const mockRatingsService = {
    rateMovie: jest.fn().mockResolvedValue(mockRating),
    getMovieRatings: jest.fn().mockResolvedValue(mockMovieRatings),
    getUserMovieRating: jest.fn().mockResolvedValue(mockRating),
    deleteRating: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingsController],
      providers: [
        {
          provide: RatingsService,
          useValue: mockRatingsService,
        },
      ],
    }).compile();

    controller = module.get<RatingsController>(RatingsController);
    service = module.get<RatingsService>(RatingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('rateMovie', () => {
    it('should rate a movie', async () => {
      const createRatingDto = { rating: 8.5 };
      const req = { user: mockUser };

      const result = await controller.rateMovie(1, createRatingDto, req as any);

      expect(result).toEqual(mockRating);
      expect(service.rateMovie).toHaveBeenCalledWith(
        'user-123',
        1,
        createRatingDto,
      );
    });
  });

  describe('getMovieRatings', () => {
    it('should return movie ratings', async () => {
      const result = await controller.getMovieRatings(1);

      expect(result).toEqual(mockMovieRatings);
      expect(service.getMovieRatings).toHaveBeenCalledWith(1);
    });
  });

  describe('getMyRating', () => {
    it('should return user rating for a movie', async () => {
      const req = { user: mockUser };

      const result = await controller.getMyRating(1, req as any);

      expect(result).toEqual(mockRating);
      expect(service.getUserMovieRating).toHaveBeenCalledWith('user-123', 1);
    });

    it('should use mock user id when no user in request', async () => {
      const req = {};

      await controller.getMyRating(1, req as any);

      expect(service.getUserMovieRating).toHaveBeenCalledWith('mock-user-id', 1);
    });
  });

  describe('deleteRating', () => {
    it('should delete a rating', async () => {
      const req = { user: mockUser };

      const result = await controller.deleteRating(1, req as any);

      expect(result).toEqual({ message: 'Rating deleted successfully' });
      expect(service.deleteRating).toHaveBeenCalledWith('user-123', 1);
    });

    it('should throw NotFoundException when rating not found', async () => {
      mockRatingsService.deleteRating.mockRejectedValueOnce(
        new NotFoundException('Rating not found'),
      );
      const req = { user: mockUser };

      await expect(controller.deleteRating(999, req as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
