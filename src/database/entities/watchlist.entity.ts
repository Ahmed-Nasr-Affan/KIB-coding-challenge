import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Movie } from './movie.entity';

@Entity('watchlist')
@Unique(['user', 'movie'])
export class Watchlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  isFavorite: boolean;

  @ManyToOne(() => User, (user) => user.watchlist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Movie, (movie) => movie.watchlists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'movie_id' })
  movie: Movie;

  @CreateDateColumn()
  createdAt: Date;
}
