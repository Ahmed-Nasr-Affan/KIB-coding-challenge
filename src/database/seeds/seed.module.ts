import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SeedService } from './seed.service';
import { TmdbModule } from '../../tmdb/tmdb.module';
import { Movie } from '../entities/movie.entity';
import { Genre } from '../entities/genre.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forFeature([Movie, Genre]),
    TmdbModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
