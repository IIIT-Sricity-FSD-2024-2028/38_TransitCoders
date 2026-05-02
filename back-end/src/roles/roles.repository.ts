import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IRole } from './interfaces/role.interface';

// ODDT-311 — RolesRepository
// NOTE: No delete() method — system roles cannot be removed.
@Injectable()
export class RolesRepository {
  private readonly roles = new Map<string, IRole>();

  findAll(): IRole[] {
    return Array.from(this.roles.values());
  }

  findById(id: string): IRole | undefined {
    return this.roles.get(id);
  }

  findByRoleId(roleId: string): IRole | undefined {
    return Array.from(this.roles.values()).find((r) => r.roleId === roleId);
  }

  // Used only by SeedService to pre-populate roles on startup
  create(data: Omit<IRole, 'id' | 'createdAt' | 'updatedAt'>): IRole {
    const role: IRole = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.roles.set(role.id, role);
    return role;
  }

  update(id: string, changes: Partial<IRole>): IRole | undefined {
    const role = this.roles.get(id);
    if (!role) return undefined;
    const updated = { ...role, ...changes, updatedAt: new Date() };
    this.roles.set(id, updated);
    return updated;
  }
  // No delete — intentional. System roles are immutable.
}
