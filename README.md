# TMDB RESTful API

A full-featured RESTful API for managing movies from The Movie Database (TMDB), with user authentication, ratings, and watchlist functionality.

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- (Optional) TMDB API Key (get one at https://www.themoviedb.org/) - or just use mine, commited in .env.example just to make it easier to run/test the project locally.

## Quick Start (3 Steps)

### Step 1: Clone and configure

```bash
git clone https://github.com/Ahmed-Nasr-Affan/KIB-coding-challenge.git
cd KIB
cp .env.example .env
```

### Step 2: Start with Docker Compose

```bash
docker-compose up --build
```

Wait for all services to be healthy (about 30 seconds). You'll see:
```
tmdb_app    | Application is running on: http://localhost:8080
tmdb_app    | API Documentation: http://localhost:8080/api-docs
```

### Step 3: Seed the database

Register a user first, then seed the database:

```bash
# Register a user (needed for seeding since endpoint is protected)
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@test.com","password":"password123"}'

# Login to get token
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin","password":"password123"}' | jq -r '.accessToken')

# Seed the database with TMDB movies
curl -X POST http://localhost:8080/seed \
  -H "Authorization: Bearer $TOKEN"
```

**That's it!** The API is now running at http://localhost:8080

Visit http://localhost:8080/api-docs for interactive API documentation.

## Run Tests

```bash
# Unit tests
npm run test

# Test coverage (requires >=85%)
npm run test:cov

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

## Development Setup

### Install dependencies

```bash
npm install
```

### Start PostgreSQL and Redis

```bash
docker-compose up postgres redis
```

### Run in development mode

```bash
npm run start:dev
```

## API Documentation

Once the application is running, visit:

- **Swagger UI**: http://localhost:8080/api-docs
- **Health Check**: http://localhost:8080

## Features

- **Movie Management**: CRUD operations for movies synced from TMDB API
- **User Authentication**: JWT-based authentication system
- **Movie Ratings**: Users can rate movies (0-10 scale)
- **Watchlist**: Add movies to watchlist and mark favorites
- **Genre Filtering**: Filter movies by genre
- **Search & Pagination**: Search movies by title with paginated results
- **Caching**: Redis-based caching for optimal performance
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Docker Support**: Fully containerized with docker-compose
- **Unit Tests**: Comprehensive test coverage (>=85%)

## Technology Stack

- **Framework**: NestJS (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **ORM**: TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **API Docs**: Swagger/OpenAPI 3.0
- **Testing**: Jest
- **Containerization**: Docker & Docker Compose

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token

### Movies

- `GET /movies` - Get all movies (with pagination, search, filters)
- `GET /movies/:id` - Get movie details
- `GET /movies/genres` - Get all genres
- `POST /movies` - Create a movie (admin)
- `PATCH /movies/:id` - Update a movie (admin)
- `DELETE /movies/:id` - Delete a movie (admin)

### Ratings

- `POST /movies/:movieId/ratings` - Rate a movie
- `GET /movies/:movieId/ratings` - Get all ratings for a movie
- `GET /movies/:movieId/ratings/my-rating` - Get your rating
- `DELETE /movies/:movieId/ratings` - Delete your rating

### Watchlist

- `GET /watchlist` - Get your watchlist
- `GET /watchlist/favorites` - Get your favorites
- `POST /watchlist/:movieId` - Add movie to watchlist
- `DELETE /watchlist/:movieId` - Remove from watchlist
- `PATCH /watchlist/:movieId/favorite` - Toggle favorite status
- `GET /watchlist/:movieId/status` - Check if movie is in watchlist

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Application port | 8080 |
| `DATABASE_HOST` | PostgreSQL host | postgres |
| `DATABASE_PORT` | PostgreSQL port | 5432 |
| `DATABASE_USER` | Database username | tmdb_user |
| `DATABASE_PASSWORD` | Database password | tmdb_password |
| `DATABASE_NAME` | Database name | tmdb_db |
| `REDIS_HOST` | Redis host | redis |
| `REDIS_PORT` | Redis port | 6379 |
| `TMDB_API_KEY` | TMDB API key | (required) |
| `TMDB_BASE_URL` | TMDB API base URL | https://api.themoviedb.org/3 |
| `JWT_SECRET` | JWT secret key | (required) |
| `JWT_EXPIRATION` | JWT token expiration | 24h |

## Project Structure

```
src/
├── auth/              # Authentication module (JWT)
├── movies/            # Movies CRUD module
├── ratings/           # Movie ratings module
├── watchlist/         # Watchlist and favorites module
├── tmdb/              # TMDB API integration
├── cache/             # Redis caching service
├── database/          # Database entities and seeds
│   ├── entities/      # TypeORM entities
│   └── seeds/         # Database seeding scripts
├── config/            # Configuration files
├── app.module.ts      # Root application module
└── main.ts            # Application entry point
```

## Database Schema

- **users**: User accounts
- **movies**: Movie information from TMDB
- **genres**: Movie genres
- **movie_genres**: Many-to-many relationship
- **ratings**: User movie ratings
- **watchlist**: User watchlist and favorites

## Security Features

- **Authentication**: JWT-based stateless authentication
- **Password Security**: bcrypt hashing with salt rounds
- **Rate Limiting**: 100 requests per minute per IP
- **Security Headers**: Helmet.js for HTTP security headers
- **CORS**: Configurable origin restrictions
- **Input Validation**: Class-validator for all DTOs
- **SQL Injection**: TypeORM parameterized queries
- **Environment Validation**: Startup validation of required variables
- **Protected Routes**: Auth guards on sensitive endpoints

## Best Practices Implemented

- **SOLID Principles**: Clean architecture with separation of concerns
- **DRY**: Reusable services and modules
- **KISS**: Simple, readable code
- **YAGNI**: No unnecessary features
- **Error Handling**: Proper exception handling with meaningful messages
- **Validation**: DTO validation using class-validator
- **Logging**: Structured logging throughout the application
- **Caching**: Redis caching with cache-aside pattern
- **Documentation**: Comprehensive API documentation with Swagger

## Production Deployment

The application is production-ready with:

- Docker multi-stage builds for optimized images
- Health checks for all services
- Environment-based configuration
- Security best practices (non-root user, etc.)
- Proper error handling and logging

