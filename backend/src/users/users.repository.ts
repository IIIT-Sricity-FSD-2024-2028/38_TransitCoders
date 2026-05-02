import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IUser } from './interfaces/user.interface';

/**
 * UsersRepository — ODDT-240 (Shreesaanth R)
 * Authoritative in-memory user store backed by Map<string, IUser>.
 *
 * Responsibilities:
 *   - Raw CRUD operations only — no business logic here.
 *   - Method signatures are stable; UsersService, AuthGuard, and AuthService
 *     all depend on this contract without knowing the storage mechanism.
 *
 * Migration note: switching to MongoDB later only requires replacing this file.
 * All consumers stay unchanged because they program to these method signatures.
 */
@Injectable()
export class UsersRepository {
  private readonly users = new Map<string, IUser>();

  // ODDT-240 — findAll: return every user record as an array
  findAll(): IUser[] {
    return Array.from(this.users.values());
  }

  // ODDT-240 — findById: look up a single user by their UUID primary key
  findById(id: string): IUser | undefined {
    return this.users.get(id);
  }

  // ODDT-240 — findByEmail: used by AuthService and UsersService for duplicate checks
  findByEmail(email: string): IUser | undefined {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }

  // ODDT-240 — findByToken: used by AuthGuard to resolve request.user from x-auth-token
  findByToken(token: string): IUser | undefined {
    return Array.from(this.users.values()).find((u) => u.authToken === token);
  }

  // ODDT-240 — create: assigns id + timestamps, then stores and returns the full record
  create(data: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): IUser {
    const user: IUser = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // ODDT-240 — update: shallow-merges changes and refreshes updatedAt
  update(id: string, changes: Partial<IUser>): IUser | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated: IUser = { ...user, ...changes, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  // ODDT-240 — delete: removes the user entry; returns true if it existed
  delete(id: string): boolean {
    return this.users.delete(id);
  }
}
