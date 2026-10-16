import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';
import { IUser } from './interfaces/user.interface';

/**
 * UsersRepository — durable SQLite-backed user store.
 *
 * Same method contract as the previous in-memory implementation, so
 * UsersService, AuthService and AuthGuard are unchanged. Data now
 * persists across server restarts (data/swifttrack.db).
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  private toUser(row: any): IUser {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      role: row.role,
      phone: row.phone ?? undefined,
      company: row.company ?? undefined,
      hubId: row.hubId ?? undefined,
      isActive: Number(row.isActive) === 1,
      authToken: row.authToken ?? undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  findAll(): IUser[] {
    return this.db.query('SELECT * FROM users ORDER BY createdAt').map((r) => this.toUser(r));
  }

  findById(id: string): IUser | undefined {
    const row = this.db.queryOne('SELECT * FROM users WHERE id = ?', [id]);
    return row ? this.toUser(row) : undefined;
  }

  findByEmail(email: string): IUser | undefined {
    const row = this.db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
    return row ? this.toUser(row) : undefined;
  }

  findByToken(token: string): IUser | undefined {
    if (!token) return undefined;
    const row = this.db.queryOne('SELECT * FROM users WHERE authToken = ?', [token]);
    return row ? this.toUser(row) : undefined;
  }

  create(data: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): IUser {
    const user: IUser = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.run(
      `INSERT INTO users (id, name, email, password, role, phone, company, hubId, isActive, authToken, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.name,
        user.email,
        user.password,
        user.role,
        user.phone ?? null,
        user.company ?? null,
        user.hubId ?? null,
        user.isActive ? 1 : 0,
        user.authToken ?? null,
        user.createdAt.toISOString(),
        user.updatedAt.toISOString(),
      ],
    );
    return user;
  }

  update(id: string, changes: Partial<IUser>): IUser | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const updated: IUser = { ...existing, ...changes, updatedAt: new Date() };
    this.db.run(
      `UPDATE users SET name = ?, email = ?, password = ?, role = ?, phone = ?, company = ?, hubId = ?, isActive = ?, authToken = ?, updatedAt = ?
       WHERE id = ?`,
      [
        updated.name,
        updated.email,
        updated.password,
        updated.role,
        updated.phone ?? null,
        updated.company ?? null,
        updated.hubId ?? null,
        updated.isActive ? 1 : 0,
        updated.authToken ?? null,
        updated.updatedAt.toISOString(),
        id,
      ],
    );
    return updated;
  }

  delete(id: string): boolean {
    const result = this.db.run('DELETE FROM users WHERE id = ?', [id]);
    return result.changes > 0;
  }
}