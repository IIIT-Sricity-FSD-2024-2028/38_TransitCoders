import { IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ODDT-312 — UpdateRoleDto
// Only permissions may be changed. name, roleId, isSystem are immutable.
export class UpdateRoleDto {
  @ApiProperty({
    description: 'Permission map — only boolean values allowed',
    example: { view_users: true, create_orders: false, manage_hubs: true },
  })
  @IsNotEmpty()
  @IsObject()
  permissions: Record<string, boolean>;
}
