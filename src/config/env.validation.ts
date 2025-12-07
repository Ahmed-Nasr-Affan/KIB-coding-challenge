import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(8080),

  // Database
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),

  // TMDB API
  TMDB_API_KEY: Joi.string().required().messages({
    'string.empty': 'TMDB_API_KEY is required. Get one from https://www.themoviedb.org/settings/api',
    'any.required': 'TMDB_API_KEY is required. Get one from https://www.themoviedb.org/settings/api',
  }),
  TMDB_BASE_URL: Joi.string().default('https://api.themoviedb.org/3'),

  // JWT Authentication
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET must be at least 32 characters for security',
    'any.required': 'JWT_SECRET is required. Generate one with: openssl rand -hex 32',
  }),
  JWT_EXPIRATION: Joi.string().default('24h'),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),

  // Data Sync
  SYNC_ENABLED: Joi.boolean().default(true),
  SYNC_INTERVAL: Joi.number().default(86400000),
});
