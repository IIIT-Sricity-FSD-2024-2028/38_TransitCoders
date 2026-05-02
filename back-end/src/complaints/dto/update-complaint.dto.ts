import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// ODDT-302 — UpdateComplaintDto
export class UpdateComplaintDto {
  @ApiPropertyOptional({ enum: ['Open', 'In Progress', 'Resolved'] })
  @IsOptional()
  @IsIn(['Open', 'In Progress', 'Resolved'])
  status?: 'Open' | 'In Progress' | 'Resolved';
}
