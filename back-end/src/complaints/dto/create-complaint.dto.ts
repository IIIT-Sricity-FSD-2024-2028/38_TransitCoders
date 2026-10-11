import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
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

  @ApiProperty({ example: 'Ordered Sony headphones but received wrong brand.' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ example: 'ORD-2024-0006' })
  @IsOptional()
  @IsString()
  orderId?: string;
}