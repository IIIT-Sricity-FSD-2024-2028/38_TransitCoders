import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IUser } from './interfaces/user.interface';

/**
 * UsersRepository — In-memory Map<string, IUser> store.
 *
 * SM NOTE: This is a LOCAL STUB for independent development.
 * VK owns the authoritative UsersRepository (ODDT-208/209/212).
 * When VK's branch merges, this file will be replaced by theirs.
 * Keep method signatures identical so UsersService never needs to change.
 */
@Injectable()
export class UsersRepository {
  private readonly users = new Map<string, IUser>();

  findAll(): IUser[] {
    return Array.from(this.users.values());
  }

  findById(id: string): IUser | undefined {
    return this.users.get(id);
  }

  findByEmail(email: string): IUser | undefined {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }

  findByToken(token: string): IUser | undefined {
    return Array.from(this.users.values()).find((u) => u.authToken === token);
  }

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

  update(id: string, changes: Partial<IUser>): IUser | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...changes, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.users.delete(id);
  }
}
