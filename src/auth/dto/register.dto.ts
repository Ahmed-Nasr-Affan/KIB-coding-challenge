import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Username', example: 'johndoe' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: 'Email address', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password', example: 'SecurePass123!' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;
}
