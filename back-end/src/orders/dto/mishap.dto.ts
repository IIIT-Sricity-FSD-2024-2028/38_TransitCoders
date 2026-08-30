import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class MishapDto {
  @ApiProperty({
    enum: ['vehicle_breakdown', 'address_not_found', 'customer_unavailable', 'package_damaged', 'other'],
    example: 'customer_unavailable',
  })
  @IsIn([
    'vehicle_breakdown',
    'address_not_found',
    'customer_unavailable',
    'package_damaged',
    'other',
  ])
  type: string;

  @ApiProperty({ required: false, example: 'Customer did not answer the door after 3 attempts' })
  @IsString()
  @IsOptional()
  description?: string;
}