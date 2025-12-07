import { ApiProperty } from '@nestjs/swagger';
import { MovieResponseDto } from '../../movies/dto/movie-response.dto';

export class WatchlistItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  isFavorite: boolean;

  @ApiProperty({ type: () => MovieResponseDto })
  movie: MovieResponseDto;

  @ApiProperty()
  createdAt: Date;
}

export class WatchlistResponseDto {
  @ApiProperty({ type: [WatchlistItemDto] })
  watchlist: WatchlistItemDto[];

  @ApiProperty()
  total: number;
}
