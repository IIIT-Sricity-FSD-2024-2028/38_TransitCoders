import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  // ODDT-242 — findAll & findById
  findAll(): IUser[] {
    return this.usersRepository.findAll();
  }

  findById(id: string): IUser {
    const user = this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ODDT-243 — create with duplicate email check + bcrypt
  async create(dto: CreateUserDto): Promise<IUser> {
    const existing = this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.usersRepository.create({
      ...dto,
      password: hashedPassword,
      isActive: false,
    });
  }

  // ODDT-244 — update
  async update(id: string, dto: UpdateUserDto): Promise<IUser> {
    this.findById(id); // throws NotFoundException if missing
    const changes: Partial<IUser> = { ...dto };
    if (dto.password) {
      changes.password = await bcrypt.hash(dto.password, 10);
    }
    return this.usersRepository.update(id, changes)!;
  }

  // ODDT-245 — delete with self-delete prevention
  delete(id: string, requesterId: string): void {
    if (id === requesterId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    this.findById(id); // throws NotFoundException if missing
    this.usersRepository.delete(id);
  }

  // ODDT-246 — approve user
  approve(id: string): IUser {
    const user = this.findById(id);
    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }
    return this.usersRepository.update(id, { isActive: true })!;
  }
}
