import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser, ISafeUser } from './interfaces/user.interface';
import { Role } from '../common/constants/roles.constant';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  private sanitize(user: IUser): ISafeUser {
    const { password: _pw, authToken: _t, ...safe } = user;
    return safe;
  }

  // ODDT-242 — findAll & findById
  findAll(): ISafeUser[] {
    return this.usersRepository.findAll().map(u => this.sanitize(u));
  }

  findById(id: string): ISafeUser {
    const user = this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  // ODDT-243 — create with duplicate email check + bcrypt
  async create(dto: CreateUserDto, currentUser?: IUser): Promise<ISafeUser> {
    if (currentUser && currentUser.role !== Role.SUPER_USER) {
      if (dto.role === Role.SUPER_USER || dto.role === Role.ADMIN) {
        throw new ForbiddenException('Only super_user can create admin-level accounts');
      }
    }
    const existing = this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.sanitize(this.usersRepository.create({
      ...dto,
      password: hashedPassword,
      isActive: false,
    }));
  }

  // ODDT-244 — update
  async update(id: string, dto: UpdateUserDto, currentUser?: IUser): Promise<ISafeUser> {
    if (currentUser && currentUser.role !== Role.SUPER_USER && dto.role) {
      if (dto.role === Role.SUPER_USER || dto.role === Role.ADMIN) {
        throw new ForbiddenException('Only super_user can assign admin-level roles');
      }
    }
    const targetUser = this.findById(id); // throws NotFoundException if missing
    
    if (currentUser && currentUser.role !== Role.SUPER_USER) {
      if (targetUser.role === Role.SUPER_USER || targetUser.role === Role.ADMIN) {
        throw new ForbiddenException('You do not have permission to modify admin-level accounts');
      }
    }

    const changes: Partial<IUser> = { ...dto };
    if (dto.password) {
      changes.password = await bcrypt.hash(dto.password, 10);
    }
    return this.sanitize(this.usersRepository.update(id, changes)!);
  }

  // ODDT-245 — delete with self-delete prevention
  delete(id: string, requesterId: string, currentUser?: IUser): void {
    if (id === requesterId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    const targetUser = this.findById(id); // throws NotFoundException if missing
    
    if (currentUser && currentUser.role !== Role.SUPER_USER) {
      if (targetUser.role === Role.SUPER_USER || targetUser.role === Role.ADMIN) {
        throw new ForbiddenException('You do not have permission to delete admin-level accounts');
      }
    }

    this.usersRepository.delete(id);
  }

  // ODDT-246 — approve user
  approve(id: string): ISafeUser {
    const user = this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    if (user.isActive) {
      throw new BadRequestException('User is already active');
    }
    return this.sanitize(this.usersRepository.update(id, { isActive: true })!);
  }
}
