import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class SchedulePickupDto {
  @ApiProperty({ example: '2026-09-02T10:30:00.000Z', description: 'Requested pickup date/time (ISO)' })
  @IsDateString()
  pickupAt: string;
}