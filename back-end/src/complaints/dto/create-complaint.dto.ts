import { IsNotEmpty, IsOptional, IsString, IsIn, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ComplaintPriority } from '../interfaces/complaint.interface';

export class CreateComplaintDto {
  @ApiProperty({ example: 'Damaged Package' })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiPropertyOptional({ enum: ['Low', 'Medium', 'High', 'Critical'], example: 'Medium' })
  @IsOptional()
  @IsIn(['Low', 'Medium', 'High', 'Critical'])
  priority?: ComplaintPriority;

  @ApiPropertyOptional({ example: 'Ordered Sony headphones but received wrong brand.' })
  @ValidateIf((o) => !o.details)
  @IsNotEmpty({ message: 'description or details must not be empty' })
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'ORD-2024-0006' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  details?: string;

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