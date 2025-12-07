import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty({ description: 'Rating value (0-10)', minimum: 0, maximum: 10, example: 8.5 })
  @IsNumber()
  @Min(0)
  @Max(10)
  rating: number;
}
