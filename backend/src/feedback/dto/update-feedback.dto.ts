import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// ODDT-307 — UpdateFeedbackDto
export class UpdateFeedbackDto {
  @ApiPropertyOptional({ enum: ['New', 'Reviewed', 'Actioned'] })
  @IsOptional()
  @IsIn(['New', 'Reviewed', 'Actioned'])
  status?: 'New' | 'Reviewed' | 'Actioned';
}
