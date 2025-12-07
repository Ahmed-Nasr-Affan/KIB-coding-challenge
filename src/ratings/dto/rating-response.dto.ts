import { ApiProperty } from '@nestjs/swagger';

export class RatingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  movieId: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class MovieRatingsResponseDto {
  @ApiProperty()
  movieId: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalRatings: number;

  @ApiProperty({ type: [RatingResponseDto] })
  ratings: RatingResponseDto[];
}
