import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Username or email', example: 'johndoe' })
  @IsString()
  usernameOrEmail: string;

  @ApiProperty({ description: 'Password', example: 'SecurePass123!' })
  @IsString()
  password: string;
}
