import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ODDT-302 — CreateTicketDto
export class CreateTicketDto {
  @ApiProperty({ example: 'Order not delivered on time' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ enum: ['low', 'med', 'high'], example: 'med' })
  @IsIn(['low', 'med', 'high'])
  priority: 'low' | 'med' | 'high';

  @ApiPropertyOptional({ example: 'ST-100002' })
  @IsOptional()
  @IsString()
  trackingId?: string;
}
