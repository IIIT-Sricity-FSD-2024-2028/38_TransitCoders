import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty({ required: false, description: 'Name of the recipient' })
  @IsString()
  @IsOptional()
  recipient?: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  originHubId!: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  destinationHubId!: string;

  @ApiProperty({ enum: ['standard', 'express', 'same-day'] })
  @IsEnum(['standard', 'express', 'same-day'])
  serviceType!: 'standard' | 'express' | 'same-day';

  @ApiProperty() @IsNumber() @Min(0.1)
  weight!: number;

  @ApiProperty({ required: false }) @IsString() @IsOptional()
  merchantId?: string;
}
