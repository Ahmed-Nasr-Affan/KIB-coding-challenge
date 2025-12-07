import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../../app.module';
import { SeedService } from './seed.service';

/**
 * Standalone script to run database seeding
 * Usage: npm run seed
 */
async function bootstrap() {
  console.log('Starting database seed...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);
  const seedService = app.get(SeedService);

  // Verify TMDB API key is configured
  const apiKey = configService.get('TMDB_API_KEY');
  if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
    console.error('TMDB_API_KEY is not configured in .env file');
    await app.close();
    process.exit(1);
  }

  try {
    await seedService.runSeed();
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
