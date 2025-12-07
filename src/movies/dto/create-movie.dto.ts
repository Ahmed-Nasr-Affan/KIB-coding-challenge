import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMovieDto {
  @ApiProperty({ description: 'Movie ID from TMDB' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Movie title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Movie overview/description', required: false })
  @IsOptional()
  @IsString()
  overview?: string;

  @ApiProperty({ description: 'Poster path', required: false })
  @IsOptional()
  @IsString()
  posterPath?: string;

  @ApiProperty({ description: 'Backdrop path', required: false })
  @IsOptional()
  @IsString()
  backdropPath?: string;

  @ApiProperty({ description: 'Release date', required: false })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiProperty({ description: 'Vote average', required: false })
  @IsOptional()
  @IsNumber()
  voteAverage?: number;

  @ApiProperty({ description: 'Vote count', required: false })
  @IsOptional()
  @IsNumber()
  voteCount?: number;

  @ApiProperty({ description: 'Popularity', required: false })
  @IsOptional()
  @IsNumber()
  popularity?: number;

  @ApiProperty({ description: 'Adult content flag', required: false })
  @IsOptional()
  @IsBoolean()
  adult?: boolean;

  @ApiProperty({ description: 'Original language', required: false })
  @IsOptional()
  @IsString()
  originalLanguage?: string;

  @ApiProperty({ description: 'Original title', required: false })
  @IsOptional()
  @IsString()
  originalTitle?: string;

  @ApiProperty({ description: 'Genre IDs', type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  genreIds?: number[];
}
