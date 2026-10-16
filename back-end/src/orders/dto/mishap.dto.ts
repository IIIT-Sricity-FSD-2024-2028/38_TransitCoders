import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class MishapDto {
  @ApiProperty({
    enum: ['vehicle_breakdown', 'address_not_found', 'customer_unavailable', 'package_damaged', 'other'],
    example: 'customer_unavailable',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const v = value.trim().toLowerCase();
    const map: Record<string, string> = {
      customer_unavailable: 'customer_unavailable',
      unavailable: 'customer_unavailable',
      package_damaged: 'package_damaged',
      damaged_package: 'package_damaged',
      package: 'package_damaged',
      damaged: 'package_damaged',
      address_not_found: 'address_not_found',
      address_incorrect: 'address_not_found',
      address: 'address_not_found',
      vehicle_breakdown: 'vehicle_breakdown',
      vehicle: 'vehicle_breakdown',
      traffic: 'vehicle_breakdown',
      customer_refused: 'other',
      refused: 'other',
      other: 'other',
    };
    return map[v] || v;
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