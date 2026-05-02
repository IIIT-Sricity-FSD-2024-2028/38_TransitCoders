import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { IUser } from '../users/interfaces/user.interface';

/**
 * AuthService — ODDT-233, ODDT-234, ODDT-235
 * Handles register, login, and logout flows.
 * No business logic beyond auth — user management lives in UsersService.
 */
@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

  // ODDT-234 — Login: verify credentials, generate and persist token
  async login(dto: LoginDto): Promise<{ token: string; user: object }> {
    const user = this.usersRepository.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches)
      throw new UnauthorizedException('Invalid email or password');

    // Generate a UUID token and persist it so AuthGuard can look it up
    const token = uuidv4();
    this.usersRepository.update(user.id, { authToken: token });

    // Strip sensitive fields before returning
    const { password: _pw, authToken: _t, ...safeUser } = user;
    return { token, user: safeUser };
  }

  // ODDT-233 — Register: duplicate-check, hash password, persist user
  async register(dto: RegisterDto): Promise<object> {
    const existing = this.usersRepository.findByEmail(dto.email);
    if (existing)
      throw new ConflictException('An account with this email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role,
      phone: dto.phone,
      company: dto.company,
      hubId: dto.hubId,
      // Customers are auto-approved; all other roles require admin approval
      isActive: dto.role === 'customer',
    } as Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>);

    const { password: _pw, ...safeUser } = user;
    return safeUser;
  }

  // ODDT-235 — Logout: clear authToken so the token can never be reused
  logout(token: string): void {
    const user = this.usersRepository.findByToken(token);
    if (user) {
      this.usersRepository.update(user.id, { authToken: undefined });
    }
  }
}
