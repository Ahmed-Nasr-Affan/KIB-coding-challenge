import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWatchlistDto {
  @ApiPropertyOptional({ description: 'Mark as favorite', default: false })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean = false;
}
