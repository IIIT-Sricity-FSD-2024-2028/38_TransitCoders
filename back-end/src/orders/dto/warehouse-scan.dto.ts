import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class WarehouseScanDto {
  @IsIn(['check-in', 'check-out'])
  action: 'check-in' | 'check-out';

  @IsOptional()
  @IsBoolean()
  autoAssign?: boolean;
}
