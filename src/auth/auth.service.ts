import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

/**
 * Service for handling authentication
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   * @param registerDto Registration data
   * @returns Auth response with JWT token
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { username, email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
    });

    await this.userRepository.save(user);
    this.logger.log(`New user registered: ${username}`);

    // Generate JWT token
    return this.generateAuthResponse(user);
  }

  /**
   * Login user
   * @param loginDto Login credentials
   * @returns Auth response with JWT token
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { usernameOrEmail, password } = loginDto;

    // Find user by username or email
    const user = await this.userRepository.findOne({
      where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${user.username}`);

    // Generate JWT token
    return this.generateAuthResponse(user);
  }

  /**
   * Validate user by ID (used by JWT strategy)
   * @param userId User ID
   * @returns User object without password
   */
  async validateUser(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }

    // Remove password from user object
    const { password, ...result } = user;
    return result as User;
  }

  /**
   * Generate authentication response with JWT token
   * @param user User object
   * @returns Auth response
   */
  private generateAuthResponse(user: User): AuthResponseDto {
    const payload = { sub: user.id, username: user.username, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      userId: user.id,
      username: user.username,
      email: user.email,
    };
  }

  /**
   * Create a mock user for testing purposes
   */
  async createMockUser(): Promise<User> {
    const mockUserId = 'mock-user-id';

    // Check if mock user already exists
    let mockUser = await this.userRepository.findOne({ where: { id: mockUserId } });

    if (!mockUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockUser = this.userRepository.create({
        id: mockUserId,
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
      });
      await this.userRepository.save(mockUser);
      this.logger.log('Mock user created for testing');
    }

    return mockUser;
  }
}
