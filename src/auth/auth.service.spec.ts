import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../database/entities/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as User);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as User);

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.userId).toBe('user-1');
      expect(result.username).toBe('testuser');
    });

    it('should throw ConflictException when username exists', async () => {
      const registerDto = {
        username: 'testuser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login a user with valid credentials', async () => {
      const loginDto = {
        usernameOrEmail: 'testuser',
        password: 'password123',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.userId).toBe('user-1');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const loginDto = {
        usernameOrEmail: 'nonexistent',
        password: 'password123',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const loginDto = {
        usernameOrEmail: 'testuser',
        password: 'wrongpassword',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should validate and return user without password', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

      const result = await service.validateUser('user-1');

      expect(result).toBeDefined();
      expect(result!.id).toBe('user-1');
      expect((result as any).password).toBeUndefined();
    });

    it('should return null when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent');

      expect(result).toBeNull();
    });
  });
});
