# Architecture Documentation

This document describes the architecture, design patterns, and technical decisions of the TMDB RESTful API.

## Table of Contents

- [Overview](#overview)
- [Architecture Pattern](#architecture-pattern)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [Caching Strategy](#caching-strategy)
- [Security](#security)
- [Design Patterns](#design-patterns)
- [Best Practices](#best-practices)

## Overview

The TMDB RESTful API is built using **NestJS**, following a modular, layered architecture. The application provides a complete movie management system with user authentication, ratings, and watchlist functionality.

### Technology Choices

- **NestJS**: Provides excellent TypeScript support, dependency injection, and modular architecture
- **TypeORM**: Type-safe ORM with great TypeScript integration
- **PostgreSQL**: Robust, ACID-compliant relational database
- **Redis**: High-performance caching layer
- **JWT**: Stateless authentication for scalability
- **Docker**: Containerization for consistent deployment

## Architecture Pattern

### Layered Architecture

The application follows a **3-tier layered architecture**:

```
┌─────────────────────────────────────┐
│    Presentation Layer (Controllers) │
│  - HTTP Request/Response Handling   │
│  - Input Validation                 │
│  - API Documentation                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Business Logic Layer (Services)  │
│  - Business Rules                   │
│  - Data Processing                  │
│  - External API Integration         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Data Access Layer (Repositories) │
│  - Database Operations              │
│  - Entity Management                │
│  - Query Building                   │
└─────────────────────────────────────┘
```

### Module Structure

Each feature is organized into a self-contained module:

```
feature/
├── dto/                # Data Transfer Objects
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── *-response.dto.ts
├── *.controller.ts     # HTTP endpoints
├── *.service.ts        # Business logic
├── *.module.ts         # Module definition
└── *.service.spec.ts   # Unit tests
```

## Project Structure

```
src/
├── auth/                      # Authentication & Authorization
│   ├── dto/                   # Auth DTOs
│   ├── guards/                # JWT guard
│   ├── strategies/            # Passport strategies
│   ├── decorators/            # Custom decorators (@Public)
│   ├── auth.controller.ts     # Auth endpoints
│   ├── auth.service.ts        # Auth business logic
│   └── auth.module.ts
│
├── movies/                    # Movie management
│   ├── dto/                   # Movie DTOs
│   ├── movies.controller.ts   # Movie endpoints
│   ├── movies.service.ts      # Movie business logic
│   └── movies.module.ts
│
├── ratings/                   # Movie ratings
│   ├── dto/                   # Rating DTOs
│   ├── ratings.controller.ts  # Rating endpoints
│   ├── ratings.service.ts     # Rating business logic
│   └── ratings.module.ts
│
├── watchlist/                 # User watchlist & favorites
│   ├── dto/                   # Watchlist DTOs
│   ├── watchlist.controller.ts
│   ├── watchlist.service.ts
│   └── watchlist.module.ts
│
├── tmdb/                      # TMDB API integration
│   ├── interfaces/            # TMDB response types
│   ├── tmdb.service.ts        # TMDB API client
│   └── tmdb.module.ts
│
├── cache/                     # Redis caching
│   ├── cache.service.ts       # Cache abstraction
│   └── cache.module.ts
│
├── database/                  # Database layer
│   ├── entities/              # TypeORM entities
│   │   ├── user.entity.ts
│   │   ├── movie.entity.ts
│   │   ├── genre.entity.ts
│   │   ├── rating.entity.ts
│   │   └── watchlist.entity.ts
│   └── seeds/                 # Database seeding
│       ├── seed.service.ts
│       ├── seed.module.ts
│       └── seed.command.ts
│
├── config/                    # Configuration
│   └── database.config.ts
│
├── app.module.ts              # Root module
├── app.controller.ts          # Health check
├── app.service.ts
└── main.ts                    # Application bootstrap
```

## Database Design

### Entity Relationship Diagram

```
┌──────────────┐
│    Users     │
├──────────────┤
│ id (PK)      │
│ username     │
│ email        │
│ password     │
│ createdAt    │
│ updatedAt    │
└───┬──────────┘
    │
    │ 1:N
    │
    ├─────────────────────┐
    │                     │
┌───▼────────┐      ┌────▼────────┐
│  Ratings   │      │  Watchlist  │
├────────────┤      ├─────────────┤
│ id (PK)    │      │ id (PK)     │
│ rating     │      │ isFavorite  │
│ user_id(FK)│      │ user_id(FK) │
│ movie_id   │      │ movie_id    │
│ createdAt  │      │ createdAt   │
│ updatedAt  │      └─────────────┘
└────────────┘
    │
    │ N:1
    │
┌───▼──────────┐      ┌──────────────┐
│   Movies     │◄────►│    Genres    │
├──────────────┤  N:M  ├──────────────┤
│ id (PK)      │      │ id (PK)      │
│ title        │      │ name         │
│ overview     │      └──────────────┘
│ posterPath   │
│ backdropPath │
│ releaseDate  │
│ voteAverage  │
│ voteCount    │
│ popularity   │
│ createdAt    │
│ updatedAt    │
└──────────────┘
```

### Key Design Decisions

1. **UUID for Users**: UUIDs provide better security than sequential IDs
2. **TMDB ID for Movies**: Use TMDB's ID as primary key for easier synchronization
3. **Composite Unique Constraints**: User+Movie combinations prevent duplicate ratings/watchlist entries
4. **Eager Loading**: Genres are eagerly loaded with movies for performance
5. **Cascading Deletes**: Ratings and watchlist items are deleted when users/movies are removed

## Caching Strategy

### Cache-Aside Pattern

The application uses a **cache-aside (lazy loading)** pattern:

1. Check cache for data
2. If cache hit, return cached data
3. If cache miss, fetch from database
4. Store in cache for future requests

### Cached Data

- **Movie Lists**: Cached for 5 minutes
- **Movie Details**: Cached for 10 minutes
- **Genre Lists**: Cached for 1 hour (rarely changes)
- **Average Ratings**: Cached for 2 minutes

### Cache Invalidation

Cache is invalidated on:
- Movie updates/deletes
- New ratings submitted
- Movie ratings deleted

```typescript
// Cache service usage example
const movies = await this.cacheService.getOrSet(
  'movies:page:1',
  async () => await this.fetchMoviesFromDB(),
  300 // 5 minutes TTL
);
```

## Security

### Authentication Flow

```
┌──────────┐                ┌──────────┐
│  Client  │                │  Server  │
└────┬─────┘                └────┬─────┘
     │                           │
     │  POST /auth/register      │
     │──────────────────────────>│
     │                           │
     │  { accessToken, user }    │
     │<──────────────────────────│
     │                           │
     │  GET /movies              │
     │  Authorization: Bearer X  │
     │──────────────────────────>│
     │                           │
     │  Validate JWT             │
     │  Extract user from token  │
     │                           │
     │  { movies }               │
     │<──────────────────────────│
```

### Security Measures

1. **Password Hashing**: bcrypt with salt rounds (10)
2. **JWT Tokens**: Signed tokens with configurable expiration
3. **Input Validation**: class-validator on all DTOs
4. **SQL Injection Prevention**: TypeORM parameterized queries
5. **CORS**: Configurable CORS settings
6. **Helmet**: Security headers (can be added)
7. **Rate Limiting**: Can be implemented with @nestjs/throttler

### Authorization

- **Public Routes**: Registration, login, movie browsing
- **Authenticated Routes**: Ratings, watchlist management
- **Admin Routes**: Movie CRUD operations (can be implemented with roles)

## Design Patterns

### 1. Dependency Injection

NestJS's built-in DI container manages dependencies:

```typescript
@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private movieRepository: Repository<Movie>,
    private cacheService: CacheService,
  ) {}
}
```

### 2. Repository Pattern

TypeORM repositories abstract database access:

```typescript
const movie = await this.movieRepository.findOne({
  where: { id },
  relations: ['genres', 'ratings'],
});
```

### 3. DTO Pattern

Data Transfer Objects ensure type safety and validation:

```typescript
export class CreateMovieDto {
  @IsNumber()
  id: number;

  @IsString()
  title: string;
}
```

### 4. Strategy Pattern

Passport strategies for different auth methods:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // JWT validation logic
}
```

### 5. Factory Pattern

Module configuration factories:

```typescript
JwtModule.registerAsync({
  useFactory: (configService: ConfigService) => ({
    secret: configService.get('JWT_SECRET'),
  }),
});
```

### 6. Decorator Pattern

Custom decorators for metadata:

```typescript
@Public()  // Skip JWT authentication
@Get()
getPublicData() {}
```

## Best Practices

### SOLID Principles

1. **Single Responsibility**: Each service has one clear purpose
2. **Open/Closed**: Services are extensible via interfaces
3. **Liskov Substitution**: Proper use of inheritance and abstractions
4. **Interface Segregation**: Focused interfaces for specific needs
5. **Dependency Inversion**: Depend on abstractions, not concretions

### Code Quality

- **TypeScript**: Strong typing throughout
- **ESLint & Prettier**: Consistent code formatting
- **Unit Tests**: >85% code coverage
- **Documentation**: JSDoc comments on public methods
- **Error Handling**: Proper exception handling with meaningful messages

### Performance Optimizations

1. **Database Indexes**: On frequently queried fields (title, releaseDate)
2. **Eager/Lazy Loading**: Strategic loading of relations
3. **Pagination**: All list endpoints support pagination
4. **Caching**: Redis caching for read-heavy operations
5. **Connection Pooling**: PostgreSQL connection pool
6. **Query Optimization**: SelectQueryBuilder for complex queries

### Scalability Considerations

1. **Stateless Design**: JWT tokens enable horizontal scaling
2. **Database Replication**: Can add read replicas
3. **Cache Distribution**: Redis can be clustered
4. **Microservices Ready**: Modular design allows easy extraction
5. **API Versioning**: Can implement versioned routes (v1, v2)

## Data Flow Example

### User Rates a Movie

```
1. Client sends POST /movies/550/ratings { rating: 8.5 }
2. JwtAuthGuard validates token
3. RatingsController receives request
4. RatingsService.rateMovie() is called
5. Check if movie exists (with cache)
6. Check if user exists
7. Check if rating already exists
8. Create or update rating in database
9. Invalidate movie cache
10. Return rating response
11. Controller sends HTTP 201 response
```
