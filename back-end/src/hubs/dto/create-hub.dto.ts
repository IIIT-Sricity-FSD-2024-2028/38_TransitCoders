import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHubDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  hubId: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  name: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  address: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  city: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  state: string;

  @ApiProperty() @IsString() @IsNotEmpty()
  pincode: string;

  @ApiProperty({ required: false }) @IsString() @IsOptional()
  phone?: string;

  @ApiProperty({ required: false }) @IsString() @IsOptional()
  email?: string;

  @ApiProperty({ required: false }) @IsString() @IsOptional()
  managerId?: string;

  @ApiProperty({ required: false, enum: ['active', 'inactive', 'maintenance'] })
  @IsEnum(['active', 'inactive', 'maintenance'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'maintenance';

  @ApiProperty({ required: false }) @IsNumber() @IsOptional()
  capacity?: number;
}
