import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { ComplaintPriority, ComplaintStatus } from '../interfaces/complaint.interface';

export class UpdateComplaintDto {
  @ApiPropertyOptional({ enum: ['Open', 'In Progress', 'Resolved'] })
  @IsOptional()
  @IsIn(['Open', 'In Progress', 'Resolved'])
  status?: ComplaintStatus;

  @ApiPropertyOptional({ enum: ['Low', 'Medium', 'High', 'Critical'] })
  @IsOptional()
  @IsIn(['Low', 'Medium', 'High', 'Critical'])
  priority?: ComplaintPriority;

  @ApiPropertyOptional({ example: 'Updated investigation notes' })
  @IsOptional()
  @IsString()
  description?: string;
}