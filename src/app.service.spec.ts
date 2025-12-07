import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
}

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status object', () => {
      const result = service.getHealth() as HealthResponse;

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.message).toBe('TMDB RESTful API is running');
      expect(result.timestamp).toBeDefined();
    });

    it('should return a valid ISO timestamp', () => {
      const result = service.getHealth() as HealthResponse;
      const timestamp = new Date(result.timestamp);

      expect(timestamp instanceof Date).toBe(true);
      expect(!isNaN(timestamp.getTime())).toBe(true);
    });

    it('should return uptime, version, and environment', () => {
      const result = service.getHealth() as HealthResponse;

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.version).toBeDefined();
      expect(result.environment).toBeDefined();
    });
  });
});
