import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsIn, Min } from 'class-validator';

export class QuoteDto {
  @ApiProperty({ enum: ['standard', 'express', 'same-day'], example: 'express' })
  @IsIn(['standard', 'express', 'same-day'])
  serviceLevel: 'standard' | 'express' | 'same-day';

  @ApiProperty({ example: 2.5, description: 'Package weight in kg' })
  @IsNumber()
  @Min(0)
  weightKg: number;

  @ApiProperty({ enum: ['Prepaid', 'COD'], required: false, example: 'Prepaid' })
  @IsEnum(['Prepaid', 'COD'])
  @IsOptional()
  paymentMode?: 'Prepaid' | 'COD';
}

export class UpdatePricingConfigDto {
  @ApiProperty({ required: false, example: 40 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  baseFee?: number;

  @ApiProperty({ required: false, example: 25 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  perKgStandard?: number;

  @ApiProperty({ required: false, example: 45 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  perKgExpress?: number;

  @ApiProperty({ required: false, example: 80 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  perKgSameDay?: number;

  @ApiProperty({ required: false, example: 30 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  codFee?: number;

  @ApiProperty({ required: false, example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountPercent?: number;

  @ApiProperty({ required: false, example: 5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxPercent?: number;

  @ApiProperty({ required: false, example: 60 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minCharge?: number;
}