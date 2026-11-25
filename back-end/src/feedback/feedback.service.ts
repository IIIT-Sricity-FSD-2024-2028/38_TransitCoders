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
import { OrdersService } from '../orders/orders.service';

// ODDT-308 — FeedbackService
@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly usersRepository: UsersRepository,
    private readonly ordersService: OrdersService,
  ) {}

  private toResponse(feedback: IFeedback): FeedbackResponseDto {
    const user = this.usersRepository.findById(feedback.userId);
    const reference = `FBK-${feedback.id.slice(0, 8).toUpperCase()}`;
    return {
      reference,
      id: feedback.id,
      customerName: user ? user.name : feedback.userId,
      orderId: (feedback as any).orderId,
      rating: (feedback as any).rating,
      comment: feedback.comments,
      status: feedback.status,
      createdAt: feedback.createdAt,
    } as FeedbackResponseDto;
  }

  findAll(user: IUser): FeedbackResponseDto[] {
    const list =
      user.role === Role.CUSTOMER
        ? this.feedbackRepository.findByUser(user.id)
        : this.feedbackRepository.findAll();
    return list.map(f => this.toResponse(f));
  }

  findById(id: string): FeedbackResponseDto {
    const feedback = this.feedbackRepository.findById(id);
    if (!feedback) throw new NotFoundException(`Feedback ${id} not found`);
    return this.toResponse(feedback);
  }

  create(dto: CreateFeedbackDto, user: IUser): FeedbackResponseDto {
    const comments = (dto.comments || dto.comment || '').toString();
    const order = dto.orderId && this.ordersService.getAuthorizedOrder(dto.orderId.trim(), user);
    const created = this.feedbackRepository.create({
      ...dto,
      orderId: order ? order.trackingId : undefined,
      comments,
      userId: user.id,
      status: 'New',
    });
    return this.toResponse(created);
  }

  update(id: string, dto: UpdateFeedbackDto, user: IUser): FeedbackResponseDto {
    this.findById(id);
    if (![Role.SUPER_USER, Role.ADMIN].includes(user.role)) {
      throw new ForbiddenException('Only admin-level users can update feedback status');
    }
    const updated = this.feedbackRepository.update(id, dto)!;
    return this.toResponse(updated);
  }
}
