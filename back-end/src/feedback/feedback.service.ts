import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FeedbackRepository } from './feedback.repository';
import { UsersRepository } from '../users/users.repository';
import { FeedbackResponseDto } from './dto/feedback-response.dto';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { IFeedback } from './interfaces/feedback.interface';
import { IUser } from '../users/interfaces/user.interface';
import { Role } from '../common/constants/roles.constant';

// ODDT-308 — FeedbackService
@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  private toResponse(feedback: IFeedback, index: number): FeedbackResponseDto {
    const user = this.usersRepository.findById(feedback.userId);
    const reference = `FBK-${String(index + 1).padStart(4, '0')}`.toLowerCase();
    return {
      reference,
      id: feedback.id,
      customerName: user ? user.name : feedback.userId,
      rating: (feedback as any).rating,
      comment: (feedback as any).comment,
      status: feedback.status,
      createdAt: feedback.createdAt,
    } as FeedbackResponseDto;
  }

  findAll(user: IUser): FeedbackResponseDto[] {
    const list =
      user.role === Role.CUSTOMER
        ? this.feedbackRepository.findByUser(user.id)
        : this.feedbackRepository.findAll();
    return list.map((f, i) => this.toResponse(f, i));
  }

  findById(id: string): FeedbackResponseDto {
    const feedback = this.feedbackRepository.findById(id);
    if (!feedback) throw new NotFoundException(`Feedback ${id} not found`);
    return this.toResponse(feedback, 0);
  }

  create(dto: CreateFeedbackDto, user: IUser): FeedbackResponseDto {
    const created = this.feedbackRepository.create({
      ...dto,
      userId: user.id,
      status: 'New',
    });
    const all = this.feedbackRepository.findAll();
    return this.toResponse(created, all.findIndex((x) => x.id === created.id));
  }

  update(id: string, dto: UpdateFeedbackDto, user: IUser): FeedbackResponseDto {
    this.findById(id);
    if (![Role.SUPER_USER, Role.ADMIN].includes(user.role)) {
      throw new ForbiddenException('Only admin-level users can update feedback status');
    }
    const updated = this.feedbackRepository.update(id, dto)!;
    return this.toResponse(updated, 0);
  }
}
