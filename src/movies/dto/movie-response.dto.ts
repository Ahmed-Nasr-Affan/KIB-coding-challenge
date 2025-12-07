import { ApiProperty } from '@nestjs/swagger';

export class GenreDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class MovieResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  overview?: string;

  @ApiProperty({ required: false })
  posterPath?: string;

  @ApiProperty({ required: false })
  backdropPath?: string;

  @ApiProperty({ required: false })
  releaseDate?: Date;

  @ApiProperty()
  voteAverage: number;

  @ApiProperty()
  voteCount: number;

  @ApiProperty()
  popularity: number;

  @ApiProperty()
  adult: boolean;

  @ApiProperty({ required: false })
  originalLanguage?: string;

  @ApiProperty({ required: false })
  originalTitle?: string;

  @ApiProperty({ type: [GenreDto] })
  genres: GenreDto[];

  @ApiProperty({ description: 'Average rating from users', required: false })
  averageRating?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PaginatedMoviesResponseDto {
  @ApiProperty({ type: [MovieResponseDto] })
  data: MovieResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
