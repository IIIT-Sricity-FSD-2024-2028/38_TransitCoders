import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async login(dto: LoginDto): Promise<{ token: string; user: object }> {
    const user = this.usersRepository.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) throw new UnauthorizedException('Invalid email or password');

    // Generate token and store it on the user record
    const token = uuidv4();
    this.usersRepository.update(user.id, { authToken: token });

    // Return token + safe user object (no password)
    const { password: _pw, authToken: _t, ...safeUser } = user;
    return { token, user: safeUser };
  }

  async register(dto: CreateUserDto): Promise<object> {
    const existing = this.usersRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('An account with this email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      ...dto,
      password: hashedPassword,
      isActive: dto.role === 'customer', // customers auto-approved
    });

    const { password: _pw, ...safeUser } = user;
    return safeUser;
  }

  logout(token: string): void {
    const user = this.usersRepository.findByToken(token);
    if (user) this.usersRepository.update(user.id, { authToken: undefined });
  }
}
