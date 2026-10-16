import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class TransferOrderDto {
  @ApiProperty({ example: 'H003', description: 'Destination hub to send the order to' })
  @IsString()
  @IsNotEmpty()
  toHubId: string;

  @ApiProperty({ required: false, example: 'Destination hub overloaded' })
  @IsString()
  @IsOptional()
  reason?: string;
}