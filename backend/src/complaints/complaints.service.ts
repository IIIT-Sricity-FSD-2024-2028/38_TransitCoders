import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintsRepository } from './complaints.repository';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { IComplaint } from './interfaces/complaint.interface';
import { IUser } from '../users/interfaces/user.interface';
import { Role } from '../common/constants/roles.constant';

// ODDT-303 — ComplaintsService
@Injectable()
export class ComplaintsService {
  constructor(private readonly complaintsRepository: ComplaintsRepository) {}

  findAll(user: IUser): IComplaint[] {
    // Customers see only their own; super_user sees all
    if (user.role === Role.CUSTOMER) {
      return this.complaintsRepository.findByUser(user.id);
    }
    return this.complaintsRepository.findAll();
  }

  findById(id: string): IComplaint {
    const complaint = this.complaintsRepository.findById(id);
    if (!complaint) throw new NotFoundException(`Complaint ${id} not found`);
    return complaint;
  }

  create(dto: CreateComplaintDto, user: IUser): IComplaint {
    return this.complaintsRepository.create({
      ...dto,
      userId: user.id,
      status: 'Open',
    });
  }

  update(id: string, dto: UpdateComplaintDto, user: IUser): IComplaint {
    this.findById(id); // throws NotFoundException if missing
    if (user.role !== Role.SUPER_USER) {
      throw new ForbiddenException(
        'Only super_user can update complaint status',
      );
    }
    return this.complaintsRepository.update(id, dto)!;
  }
}
