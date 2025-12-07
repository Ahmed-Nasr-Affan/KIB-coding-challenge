import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { Cache } from 'cache-manager';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: Cache;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value when it exists', async () => {
      const cachedValue = { data: 'test' };
      mockCacheManager.get.mockResolvedValue(cachedValue);

      const result = await service.get<typeof cachedValue>('test-key');

      expect(result).toEqual(cachedValue);
      expect(mockCacheManager.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });

    it('should return null and log error on exception', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set a value in cache', async () => {
      const value = { data: 'test' };
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', value, 300);

      expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', value, 300);
    });

    it('should handle errors gracefully', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('Cache error'));

      await expect(service.set('test-key', 'value')).resolves.not.toThrow();
    });
  });

  describe('del', () => {
    it('should delete a cache entry', async () => {
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.del('test-key');

      expect(mockCacheManager.del).toHaveBeenCalledWith('test-key');
    });

    it('should handle errors gracefully', async () => {
      mockCacheManager.del.mockRejectedValue(new Error('Cache error'));

      await expect(service.del('test-key')).resolves.not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset the entire cache', async () => {
      mockCacheManager.reset.mockResolvedValue(undefined);

      await service.reset();

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockCacheManager.reset.mockRejectedValue(new Error('Cache error'));

      await expect(service.reset()).resolves.not.toThrow();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const cachedValue = { data: 'cached' };
      mockCacheManager.get.mockResolvedValue(cachedValue);

      const factory = jest.fn().mockResolvedValue({ data: 'new' });
      const result = await service.getOrSet('test-key', factory, 300);

      expect(result).toEqual(cachedValue);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result on cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockCacheManager.set.mockResolvedValue(undefined);

      const newValue = { data: 'new' };
      const factory = jest.fn().mockResolvedValue(newValue);

      const result = await service.getOrSet('test-key', factory, 300);

      expect(result).toEqual(newValue);
      expect(factory).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', newValue, 300);
    });
  });

  describe('invalidateByPattern', () => {
    it('should attempt to invalidate cache by pattern', async () => {
      await expect(service.invalidateByPattern('movies:*')).resolves.not.toThrow();
    });
  });
});
