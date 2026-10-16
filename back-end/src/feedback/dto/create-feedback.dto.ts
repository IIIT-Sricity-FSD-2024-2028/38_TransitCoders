import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

// ODDT-307 — CreateFeedbackDto
export class CreateFeedbackDto {
  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'ORD_3' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ example: 'Great service, fast delivery!' })
  @Transform(({ value, obj }) => (value || obj?.comment || obj?.feedback || '').toString())
  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  comment?: any;

  @IsOptional()
  customer?: any;

  @IsOptional()
  createdAt?: any;

  @IsOptional()
  date?: any;

  @IsOptional()
  status?: any;

  @IsOptional()
  userId?: any;
}
