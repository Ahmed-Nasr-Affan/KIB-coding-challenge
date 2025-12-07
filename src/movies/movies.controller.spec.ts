import { Test, TestingModule } from '@nestjs/testing';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { NotFoundException } from '@nestjs/common';

describe('MoviesController', () => {
  let controller: MoviesController;
  let service: MoviesService;

  const mockMovie = {
    id: 1,
    title: 'Test Movie',
    overview: 'Test overview',
    posterPath: '/test.jpg',
    releaseDate: new Date('2023-01-01'),
    voteAverage: 8.5,
    genres: [{ id: 28, name: 'Action' }],
    averageRating: 8,
  };

  const mockPaginatedResponse = {
    data: [mockMovie],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const mockGenres = [
    { id: 28, name: 'Action' },
    { id: 35, name: 'Comedy' },
  ];

  const mockMoviesService = {
    findAll: jest.fn().mockResolvedValue(mockPaginatedResponse),
    findOne: jest.fn().mockResolvedValue(mockMovie),
    create: jest.fn().mockResolvedValue(mockMovie),
    update: jest.fn().mockResolvedValue(mockMovie),
    remove: jest.fn().mockResolvedValue(undefined),
    getAllGenres: jest.fn().mockResolvedValue(mockGenres),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [
        {
          provide: MoviesService,
          useValue: mockMoviesService,
        },
      ],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get<MoviesService>(MoviesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated movies', async () => {
      const query = { page: 1, limit: 20 };
      const result = await controller.findAll(query);

      expect(result).toEqual(mockPaginatedResponse);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should pass search and filter parameters', async () => {
      const query = { page: 1, limit: 10, search: 'test', genres: '28,35' };
      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('getAllGenres', () => {
    it('should return all genres', async () => {
      const result = await controller.getAllGenres();

      expect(result).toEqual(mockGenres);
      expect(service.getAllGenres).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a movie by ID', async () => {
      const result = await controller.findOne(1);

      expect(result).toEqual(mockMovie);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when movie not found', async () => {
      mockMoviesService.findOne.mockRejectedValueOnce(
        new NotFoundException('Movie not found'),
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new movie', async () => {
      const createDto = {
        id: 1,
        title: 'New Movie',
        overview: 'New overview',
        genreIds: [28],
      };

      const result = await controller.create(createDto as any);

      expect(result).toEqual(mockMovie);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update a movie', async () => {
      const updateDto = { title: 'Updated Movie' };
      const updatedMovie = { ...mockMovie, title: 'Updated Movie' };
      mockMoviesService.update.mockResolvedValueOnce(updatedMovie);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(updatedMovie);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should throw NotFoundException when updating non-existent movie', async () => {
      mockMoviesService.update.mockRejectedValueOnce(
        new NotFoundException('Movie not found'),
      );

      await expect(controller.update(999, { title: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a movie', async () => {
      const result = await controller.remove(1);

      expect(result).toEqual({ message: 'Movie deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when deleting non-existent movie', async () => {
      mockMoviesService.remove.mockRejectedValueOnce(
        new NotFoundException('Movie not found'),
      );

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
