import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthResponse = {
    accessToken: 'jwt-token-123',
    userId: 'user-123',
    username: 'testuser',
    email: 'test@test.com',
  };

  const mockAuthService = {
    register: jest.fn().mockResolvedValue(mockAuthResponse),
    login: jest.fn().mockResolvedValue(mockAuthResponse),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
      };

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockAuthResponse);
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw ConflictException when user already exists', async () => {
      mockAuthService.register.mockRejectedValueOnce(
        new ConflictException('Username already exists'),
      );

      const registerDto = {
        username: 'existinguser',
        email: 'existing@test.com',
        password: 'password123',
      };

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto = {
        usernameOrEmail: 'testuser',
        password: 'password123',
      };

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockAuthService.login.mockRejectedValueOnce(
        new UnauthorizedException('Invalid credentials'),
      );

      const loginDto = {
        usernameOrEmail: 'wronguser',
        password: 'wrongpassword',
      };

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
