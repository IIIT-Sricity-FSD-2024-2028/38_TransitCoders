import {
  BadRequestException,
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
import { OrdersService } from '../orders/orders.service';

// ODDT-303 — ComplaintsService
@Injectable()
export class ComplaintsService {
  constructor(
    private readonly complaintsRepository: ComplaintsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly ordersService: OrdersService,
  ) {}

  private toResponse(complaint: IComplaint): ComplaintResponseDto {
    const user = this.usersRepository.findById(complaint.userId);
    const reference = `CMP-${complaint.id.slice(0, 8).toUpperCase()}`;
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
    if (user.role === Role.CUSTOMER) return this.complaintsRepository.findByUser(user.id).map(c => this.toResponse(c));
    if (user.role === Role.HUB_MANAGER) return this.complaintsRepository.findByHub(user.hubId ?? '').map(c => this.toResponse(c));
    return this.complaintsRepository.findAll().map(c => this.toResponse(c));
  }

  findById(id: string): ComplaintResponseDto {
    const complaint = this.complaintsRepository.findById(id);
    if (!complaint) throw new NotFoundException(`Complaint ${id} not found`);
    return this.toResponse(complaint);
  }

  create(dto: CreateComplaintDto, user: IUser): ComplaintResponseDto {
    const description = (dto.description || dto.details || '').trim();
    if (!description) throw new BadRequestException('Description is required');
    const order = dto.orderId && this.ordersService.getAuthorizedOrder(dto.orderId.trim(), user);
    const created = this.complaintsRepository.create({
      ...dto,
      orderId: order ? order.trackingId : undefined,
      description,
      userId: user.id,
      priority: dto.priority ?? 'Medium', // Fallback ensures it's never undefined
      status: 'Open',
    });
    return this.toResponse(created);
  }

  update(id: string, dto: UpdateComplaintDto, user: IUser): ComplaintResponseDto {
    const existing = this.complaintsRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Complaint ${id} not found`);
    }

    if (![Role.SUPER_USER, Role.ADMIN, Role.HUB_MANAGER].includes(user.role)) {
      throw new ForbiddenException('Only admin-level users can update complaint status');
    }
    if (user.role === Role.HUB_MANAGER && !this.complaintsRepository.findByHub(user.hubId ?? '').some(complaint => complaint.id === id)) {
      throw new ForbiddenException('This complaint belongs to a different hub');
    }

    const updated = this.complaintsRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Complaint ${id} could not be updated`);
    }

    return this.toResponse(updated);
  }
}
