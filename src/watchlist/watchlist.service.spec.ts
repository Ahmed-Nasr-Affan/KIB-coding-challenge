import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { Watchlist } from '../database/entities/watchlist.entity';
import { Movie } from '../database/entities/movie.entity';
import { User } from '../database/entities/user.entity';

describe('WatchlistService', () => {
  let service: WatchlistService;
  let watchlistRepository: Repository<Watchlist>;
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

  const mockWatchlistItem = {
    id: 'watchlist-1',
    isFavorite: false,
    user: mockUser,
    movie: mockMovie,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: getRepositoryToken(Watchlist),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockWatchlistItem]),
            })),
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

    service = module.get<WatchlistService>(WatchlistService);
    watchlistRepository = module.get<Repository<Watchlist>>(getRepositoryToken(Watchlist));
    movieRepository = module.get<Repository<Movie>>(getRepositoryToken(Movie));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToWatchlist', () => {
    it('should add a movie to watchlist', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovie as Movie);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(watchlistRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(watchlistRepository, 'create').mockReturnValue(mockWatchlistItem as Watchlist);
      jest.spyOn(watchlistRepository, 'save').mockResolvedValue(mockWatchlistItem as Watchlist);

      const result = await service.addToWatchlist('user-1', 1, { isFavorite: false });

      expect(result).toBeDefined();
      expect(watchlistRepository.create).toHaveBeenCalled();
      expect(watchlistRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when movie already in watchlist', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(mockMovie as Movie);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(watchlistRepository, 'findOne').mockResolvedValue(mockWatchlistItem as Watchlist);

      await expect(service.addToWatchlist('user-1', 1, { isFavorite: false })).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when movie not found', async () => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(null);

      await expect(service.addToWatchlist('user-1', 999, { isFavorite: false })).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserWatchlist', () => {
    it('should return user watchlist', async () => {
      const result = await service.getUserWatchlist('user-1', false);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
    });

    it('should return only favorites when filter is true', async () => {
      const result = await service.getUserWatchlist('user-1', true);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('removeFromWatchlist', () => {
    it('should remove a movie from watchlist', async () => {
      jest.spyOn(watchlistRepository, 'findOne').mockResolvedValue(mockWatchlistItem as Watchlist);
      jest.spyOn(watchlistRepository, 'remove').mockResolvedValue(mockWatchlistItem as Watchlist);

      await service.removeFromWatchlist('user-1', 1);

      expect(watchlistRepository.remove).toHaveBeenCalledWith(mockWatchlistItem);
    });

    it('should throw NotFoundException when watchlist item not found', async () => {
      jest.spyOn(watchlistRepository, 'findOne').mockResolvedValue(null);

      await expect(service.removeFromWatchlist('user-1', 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {
      jest.spyOn(watchlistRepository, 'findOne').mockResolvedValue(mockWatchlistItem as Watchlist);
      jest.spyOn(watchlistRepository, 'save').mockResolvedValue({ ...mockWatchlistItem, isFavorite: true } as Watchlist);

      const result = await service.toggleFavorite('user-1', 1);

      expect(result).toBeDefined();
      expect(result.isFavorite).toBe(true);
    });

    it('should throw NotFoundException when watchlist item not found', async () => {
      jest.spyOn(watchlistRepository, 'findOne').mockResolvedValue(null);

      await expect(service.toggleFavorite('user-1', 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('isInWatchlist', () => {
    it('should return true when movie is in watchlist', async () => {
      jest.spyOn(watchlistRepository, 'count').mockResolvedValue(1);

      const result = await service.isInWatchlist('user-1', 1);

      expect(result).toBe(true);
    });

    it('should return false when movie is not in watchlist', async () => {
      jest.spyOn(watchlistRepository, 'count').mockResolvedValue(0);

      const result = await service.isInWatchlist('user-1', 1);

      expect(result).toBe(false);
    });
  });

  describe('getUserFavorites', () => {
    it('should return user favorites', async () => {
      const result = await service.getUserFavorites('user-1');

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Array);
    });
  });
});
