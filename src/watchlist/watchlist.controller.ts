import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  Req,
  ParseIntPipe,
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { WatchlistService } from './watchlist.service';
import { CreateWatchlistDto } from './dto/create-watchlist.dto';
import { WatchlistItemDto, WatchlistResponseDto } from './dto/watchlist-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('watchlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  @ApiOperation({ summary: "Get user's watchlist" })
  @ApiQuery({ name: 'favoritesOnly', required: false, type: Boolean, description: 'Filter favorites only' })
  @ApiResponse({ status: 200, description: "Returns user's watchlist", type: WatchlistResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWatchlist(
    @Query('favoritesOnly', new ParseBoolPipe({ optional: true })) favoritesOnly: boolean = false,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const watchlist = await this.watchlistService.getUserWatchlist(userId, favoritesOnly);

    return {
      watchlist,
      total: watchlist.length,
    };
  }

  @Get('favorites')
  @ApiOperation({ summary: "Get user's favorite movies" })
  @ApiResponse({ status: 200, description: "Returns user's favorites", type: WatchlistResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFavorites(@Req() req: any) {
    const userId = req.user.id;
    const favorites = await this.watchlistService.getUserFavorites(userId);

    return {
      watchlist: favorites,
      total: favorites.length,
    };
  }

  @Post(':movieId')
  @ApiOperation({ summary: 'Add a movie to watchlist' })
  @ApiParam({ name: 'movieId', description: 'Movie ID' })
  @ApiResponse({ status: 201, description: 'Movie added to watchlist', type: WatchlistItemDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie or user not found' })
  @ApiResponse({ status: 409, description: 'Movie already in watchlist' })
  async addToWatchlist(
    @Param('movieId', ParseIntPipe) movieId: number,
    @Body() createWatchlistDto: CreateWatchlistDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return await this.watchlistService.addToWatchlist(userId, movieId, createWatchlistDto);
  }

  @Delete(':movieId')
  @ApiOperation({ summary: 'Remove a movie from watchlist' })
  @ApiParam({ name: 'movieId', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: 'Movie removed from watchlist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie not found in watchlist' })
  async removeFromWatchlist(@Param('movieId', ParseIntPipe) movieId: number, @Req() req: any) {
    const userId = req.user.id;
    await this.watchlistService.removeFromWatchlist(userId, movieId);
    return { message: 'Movie removed from watchlist successfully' };
  }

  @Patch(':movieId/favorite')
  @ApiOperation({ summary: 'Toggle favorite status for a movie' })
  @ApiParam({ name: 'movieId', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: 'Favorite status toggled', type: WatchlistItemDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Movie not found in watchlist' })
  async toggleFavorite(@Param('movieId', ParseIntPipe) movieId: number, @Req() req: any) {
    const userId = req.user.id;
    return await this.watchlistService.toggleFavorite(userId, movieId);
  }

  @Get(':movieId/status')
  @ApiOperation({ summary: 'Check if a movie is in watchlist' })
  @ApiParam({ name: 'movieId', description: 'Movie ID' })
  @ApiResponse({ status: 200, description: 'Returns watchlist status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkWatchlistStatus(@Param('movieId', ParseIntPipe) movieId: number, @Req() req: any) {
    const userId = req.user.id;
    const inWatchlist = await this.watchlistService.isInWatchlist(userId, movieId);
    return { inWatchlist };
  }
}
