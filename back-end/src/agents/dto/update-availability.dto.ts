import { IsIn } from 'class-validator';

export class UpdateAvailabilityDto {
  @IsIn(['Available', 'Busy', 'Offline'])
  availabilityStatus: 'Available' | 'Busy' | 'Offline';
}
