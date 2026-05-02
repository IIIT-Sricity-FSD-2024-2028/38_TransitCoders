import { Injectable, NotFoundException } from '@nestjs/common';
import { RolesRepository } from './roles.repository';
import { UpdateRoleDto } from './dto/update-role.dto';
import { IRole } from './interfaces/role.interface';

// ODDT-313 — RolesService
@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  findAll(): IRole[] {
    return this.rolesRepository.findAll();
  }

  findById(id: string): IRole {
    const role = this.rolesRepository.findById(id);
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  update(id: string, dto: UpdateRoleDto): IRole {
    this.findById(id); // throws NotFoundException if missing
    // Only permissions can be updated — name, roleId, isSystem are immutable.
    // This is enforced by the DTO shape (UpdateRoleDto only has .permissions).
    return this.rolesRepository.update(id, { permissions: dto.permissions })!;
  }
}
