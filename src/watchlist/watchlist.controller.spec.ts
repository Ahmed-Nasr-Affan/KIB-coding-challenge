import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('WatchlistController', () => {
  let controller: WatchlistController;
  let service: WatchlistService;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@test.com',
  };

  const mockWatchlistItem = {
    id: 'watchlist-123',
    isFavorite: false,
    userId: 'user-123',
    movieId: 1,
    movie: {
      id: 1,
      title: 'Test Movie',
      genres: [{ id: 28, name: 'Action' }],
    },
    createdAt: new Date(),
  };

  const mockWatchlistService = {
    addToWatchlist: jest.fn().mockResolvedValue(mockWatchlistItem),
    getUserWatchlist: jest.fn().mockResolvedValue([mockWatchlistItem]),
    removeFromWatchlist: jest.fn().mockResolvedValue(undefined),
    toggleFavorite: jest.fn().mockResolvedValue({ ...mockWatchlistItem, isFavorite: true }),
    isInWatchlist: jest.fn().mockResolvedValue(true),
    getUserFavorites: jest.fn().mockResolvedValue([{ ...mockWatchlistItem, isFavorite: true }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WatchlistController],
      providers: [
        {
          provide: WatchlistService,
          useValue: mockWatchlistService,
        },
      ],
    }).compile();

    controller = module.get<WatchlistController>(WatchlistController);
    service = module.get<WatchlistService>(WatchlistService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWatchlist', () => {
    it('should return user watchlist with response format', async () => {
      const req = { user: mockUser };

      const result = await controller.getWatchlist(false, req as any);

      expect(result).toEqual({
        watchlist: [mockWatchlistItem],
        total: 1,
      });
      expect(service.getUserWatchlist).toHaveBeenCalledWith('user-123', false);
    });

    it('should filter by favorites only', async () => {
      const req = { user: mockUser };

      await controller.getWatchlist(true, req as any);

      expect(service.getUserWatchlist).toHaveBeenCalledWith('user-123', true);
    });
  });

  describe('getFavorites', () => {
    it('should return user favorites with response format', async () => {
      const req = { user: mockUser };

      const result = await controller.getFavorites(req as any);

      expect(result).toEqual({
        watchlist: [{ ...mockWatchlistItem, isFavorite: true }],
        total: 1,
      });
      expect(service.getUserFavorites).toHaveBeenCalledWith('user-123');
    });
  });

  describe('addToWatchlist', () => {
    it('should add movie to watchlist', async () => {
      const req = { user: mockUser };

      const result = await controller.addToWatchlist(1, {}, req as any);

      expect(result).toEqual(mockWatchlistItem);
      expect(service.addToWatchlist).toHaveBeenCalledWith('user-123', 1, {});
    });

    it('should add as favorite', async () => {
      const req = { user: mockUser };

      await controller.addToWatchlist(1, { isFavorite: true }, req as any);

      expect(service.addToWatchlist).toHaveBeenCalledWith('user-123', 1, { isFavorite: true });
    });

    it('should throw ConflictException when already in watchlist', async () => {
      mockWatchlistService.addToWatchlist.mockRejectedValueOnce(
        new ConflictException('Already in watchlist'),
      );
      const req = { user: mockUser };

      await expect(controller.addToWatchlist(1, {}, req as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('removeFromWatchlist', () => {
    it('should remove movie from watchlist', async () => {
      const req = { user: mockUser };

      const result = await controller.removeFromWatchlist(1, req as any);

      expect(result).toEqual({ message: 'Movie removed from watchlist successfully' });
      expect(service.removeFromWatchlist).toHaveBeenCalledWith('user-123', 1);
    });

    it('should throw NotFoundException when not in watchlist', async () => {
      mockWatchlistService.removeFromWatchlist.mockRejectedValueOnce(
        new NotFoundException('Not in watchlist'),
      );
      const req = { user: mockUser };

      await expect(controller.removeFromWatchlist(999, req as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {
      const req = { user: mockUser };

      const result = await controller.toggleFavorite(1, req as any);

      expect(result).toEqual({ ...mockWatchlistItem, isFavorite: true });
      expect(service.toggleFavorite).toHaveBeenCalledWith('user-123', 1);
    });
  });

  describe('checkWatchlistStatus', () => {
    it('should return watchlist status', async () => {
      const req = { user: mockUser };

      const result = await controller.checkWatchlistStatus(1, req as any);

      expect(result).toEqual({ inWatchlist: true });
      expect(service.isInWatchlist).toHaveBeenCalledWith('user-123', 1);
    });

    it('should return false when not in watchlist', async () => {
      mockWatchlistService.isInWatchlist.mockResolvedValueOnce(false);
      const req = { user: mockUser };

      const result = await controller.checkWatchlistStatus(999, req as any);

      expect(result).toEqual({ inWatchlist: false });
    });
  });
});
