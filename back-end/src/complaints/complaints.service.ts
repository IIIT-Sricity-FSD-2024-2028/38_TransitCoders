import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintsRepository } from './complaints.repository';
import { UsersRepository } from '../users/users.repository';
import { ComplaintResponseDto } from './dto/complaint-response.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { IComplaint } from './interfaces/complaint.interface';
import { IUser } from '../users/interfaces/user.interface';
import { Role } from '../common/constants/roles.constant';

// ODDT-303 — ComplaintsService
@Injectable()
export class ComplaintsService {
  constructor(
    private readonly complaintsRepository: ComplaintsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  private toResponse(complaint: IComplaint, index: number): ComplaintResponseDto {
    const user = this.usersRepository.findById(complaint.userId);
    const reference = `CMP-${String(index + 1).padStart(4, '0')}`.toLowerCase();
    return {
      reference,
      id: complaint.id,
      customerName: user ? user.name : complaint.userId,
      orderId: (complaint as any).orderId,
      type: complaint.type,
      priority: complaint.priority,
      description: complaint.description,
      status: complaint.status,
      createdAt: complaint.createdAt,
      updatedAt: (complaint as any).updatedAt,
    } as ComplaintResponseDto;
  }

  findAll(user: IUser): ComplaintResponseDto[] {
    const list =
      user.role === Role.CUSTOMER
        ? this.complaintsRepository.findByUser(user.id)
        : this.complaintsRepository.findAll();
    return list.map((c, i) => this.toResponse(c, i));
  }

  findById(id: string): ComplaintResponseDto {
    const complaint = this.complaintsRepository.findById(id);
    if (!complaint) throw new NotFoundException(`Complaint ${id} not found`);
    // For a single item, use index 0 for stable reference
    return this.toResponse(complaint, 0);
  }

  create(dto: CreateComplaintDto, user: IUser): ComplaintResponseDto {
    const created = this.complaintsRepository.create({
      ...dto,
      userId: user.id,
      priority: dto.priority ?? 'Medium', // Fallback ensures it's never undefined
      status: 'Open',
    });
    const all = this.complaintsRepository.findAll();
    return this.toResponse(created, all.findIndex((x) => x.id === created.id));
  }

  update(id: string, dto: UpdateComplaintDto, user: IUser): ComplaintResponseDto {
    const existing = this.complaintsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Complaint ${id} not found`);
    }

    if (![Role.SUPER_USER, Role.ADMIN, Role.HUB_MANAGER].includes(user.role)) {
      throw new ForbiddenException('Only admin-level users can update complaint status');
    }

    const updated = this.complaintsRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Complaint ${id} could not be updated`);
    }

    return this.toResponse(updated, 0);
  }
}
