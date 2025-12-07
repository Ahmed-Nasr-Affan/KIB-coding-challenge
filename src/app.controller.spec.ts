import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SeedService } from './database/seeds/seed.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;
  let seedService: SeedService;

  const mockSeedService = {
    runSeed: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: SeedService,
          useValue: mockSeedService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
    seedService = app.get<SeedService>(SeedService);
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = {
        status: 'ok',
        message: 'TMDB RESTful API is running',
        timestamp: new Date().toISOString(),
      };

      jest.spyOn(appService, 'getHealth').mockReturnValue(result);

      expect(appController.getHealth()).toEqual(result);
    });
  });

  describe('seedDatabase', () => {
    it('should seed the database', async () => {
      const result = await appController.seedDatabase();

      expect(result).toEqual({ message: 'Database seeded successfully' });
      expect(mockSeedService.runSeed).toHaveBeenCalled();
    });
  });
});
