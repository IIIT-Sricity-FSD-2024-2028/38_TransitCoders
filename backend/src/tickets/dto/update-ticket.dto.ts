import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// ODDT-302 — UpdateTicketDto
export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: ['open', 'in-progress', 'resolved', 'closed'] })
  @IsOptional()
  @IsIn(['open', 'in-progress', 'resolved', 'closed'])
  status?: 'open' | 'in-progress' | 'resolved' | 'closed';

  @ApiPropertyOptional({ enum: ['low', 'med', 'high'] })
  @IsOptional()
  @IsIn(['low', 'med', 'high'])
  priority?: 'low' | 'med' | 'high';
}
