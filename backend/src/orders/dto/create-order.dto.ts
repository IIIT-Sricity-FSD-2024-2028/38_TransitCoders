import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @IsEnum(['Low', 'Medium', 'High'])
  priority: 'Low' | 'Medium' | 'High';

  @IsString()
  @IsOptional()
  pickupAddress?: string;

  @IsString()
  @IsOptional()
  packageType?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsEnum(['Prepaid', 'COD'])
  @IsOptional()
  paymentMode?: 'Prepaid' | 'COD';
}
