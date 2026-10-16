import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsIn,
  Min,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ description: 'Customer UUID receiving the delivery' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ required: false, description: 'Tracking ID (e.g. TRK-AB12CD34)' })
  @IsString()
  @IsOptional()
  trackingId?: string;

  @ApiProperty({ description: 'Full delivery address' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @ApiProperty({ enum: ['Low', 'Medium', 'High'] })
  @IsEnum(['Low', 'Medium', 'High'])
  priority: 'Low' | 'Medium' | 'High';

  @ApiProperty({ required: false, description: 'Where the package is picked up from' })
  @IsString()
  @IsOptional()
  pickupAddress?: string;

  @ApiProperty({ required: false, description: 'Pickup hub id, e.g. H001' })
  @IsString()
  @IsOptional()
  pickupHubId?: string;

  @ApiProperty({ required: false, description: 'Destination hub id, e.g. H003' })
  @IsString()
  @IsOptional()
  deliveryHubId?: string;

  @ApiProperty({ required: false, description: 'Product/package category' })
  @IsString()
  @IsOptional()
  packageType?: string;

  @ApiProperty({ required: false, example: 2.5, description: 'Weight in kg (pricing input)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  weight?: number;

  @ApiProperty({
    enum: ['standard', 'express', 'same-day'],
    required: false,
    default: 'standard',
    description: 'Service level (pricing input)',
  })
  @IsIn(['standard', 'express', 'same-day'])
  @IsOptional()
  serviceLevel?: 'standard' | 'express' | 'same-day';

  @ApiProperty({ enum: ['Prepaid', 'COD'], required: false, default: 'Prepaid' })
  @IsEnum(['Prepaid', 'COD'])
  @IsOptional()
  paymentMode?: 'Prepaid' | 'COD';

  @ApiProperty({ required: false, description: 'ISO datetime to schedule the pickup' })
  @IsDateString()
  @IsOptional()
  pickupScheduledAt?: string;

  @ApiProperty({ required: false, description: 'ISO datetime estimated delivery' })
  @IsDateString()
  @IsOptional()
  estimatedDelivery?: string;

  // ── BACKWARD COMPATIBILITY ────────────────────────────────────────────────
  // Accepted but IGNORED. The final charge is computed by the backend
  // PricingService from pricing_config — the client can never set the price.
  // (Kept so older clients that still send `amount` do not get 400s.)
  @ApiProperty({ required: false, description: 'IGNORED — backend computes the price' })
  @IsNumber()
  @IsOptional()
  amount?: number;
}