import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';
import { IRole } from './interfaces/role.interface';

/**
 * RolesRepository — durable SQLite-backed role store.
 * Same method contract as the previous in-memory implementation.
 */
@Injectable()
export class RolesRepository {
  constructor(private readonly db: DatabaseService) {}

  private toRole(row: any): IRole {
    return {
      id: row.id,
      roleId: row.id,
      name: row.name,
      description: row.description ?? undefined,
      isSystem: Number(row.isSystem) === 1,
      permissions: JSON.parse(row.permissions || '{}'),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  findAll(): IRole[] {
    return this.db.query('SELECT * FROM roles ORDER BY createdAt').map((r) => this.toRole(r));
  }

  findById(id: string): IRole | undefined {
    const row = this.db.queryOne('SELECT * FROM roles WHERE id = ?', [id]);
    return row ? this.toRole(row) : undefined;
  }

  findByRoleId(roleId: string): IRole | undefined {
    return this.findById(roleId);
  }

  create(data: Omit<IRole, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): IRole {
    const id = data.id ?? data.roleId ?? uuidv4();
    const now = new Date();
    const role: IRole = {
      id,
      roleId: id,
      name: data.name,
      description: data.description,
      isSystem: data.isSystem,
      permissions: data.permissions,
      createdAt: now,
      updatedAt: now,
    };
    this.db.run(
      `INSERT INTO roles (id, name, description, isSystem, permissions, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        role.id,
        role.name,
        role.description ?? null,
        role.isSystem ? 1 : 0,
        JSON.stringify(role.permissions ?? {}),
        role.createdAt.toISOString(),
        role.updatedAt.toISOString(),
      ],
    );
    return role;
  }

  update(id: string, changes: Partial<IRole>): IRole | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const merged: IRole = {
      ...existing,
      ...changes,
      id: existing.id, // id immutable
      roleId: existing.id,
      updatedAt: new Date(),
    };
    this.db.run(
      `UPDATE roles SET name = ?, description = ?, isSystem = ?, permissions = ?, updatedAt = ? WHERE id = ?`,
      [
        merged.name,
        merged.description ?? null,
        merged.isSystem ? 1 : 0,
        JSON.stringify(merged.permissions ?? {}),
        merged.updatedAt.toISOString(),
        id,
      ],
    );
    return merged;
  }

  delete(id: string): boolean {
    const role = this.findById(id);
    if (role?.isSystem) return false; // system roles cannot be deleted
    const result = this.db.run('DELETE FROM roles WHERE id = ?', [id]);
    return result.changes > 0;
  }
}