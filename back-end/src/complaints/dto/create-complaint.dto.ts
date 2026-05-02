import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ODDT-302 — CreateComplaintDto
export class CreateComplaintDto {
  @ApiProperty({ example: 'My order was damaged on delivery' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'ORD_5' })
  @IsOptional()
  @IsString()
  orderId?: string;
}
