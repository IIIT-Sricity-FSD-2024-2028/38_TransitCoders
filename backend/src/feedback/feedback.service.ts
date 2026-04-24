import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FeedbackRepository } from './feedback.repository';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { IFeedback } from './interfaces/feedback.interface';
import { IUser } from '../users/interfaces/user.interface';
import { Role } from '../common/constants/roles.constant';

// ODDT-308 — FeedbackService
@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackRepository: FeedbackRepository) {}

  findAll(user: IUser): IFeedback[] {
    if (user.role === Role.CUSTOMER) {
      return this.feedbackRepository.findByUser(user.id);
    }
    return this.feedbackRepository.findAll();
  }

  findById(id: string): IFeedback {
    const feedback = this.feedbackRepository.findById(id);
    if (!feedback) throw new NotFoundException(`Feedback ${id} not found`);
    return feedback;
  }

  create(dto: CreateFeedbackDto, user: IUser): IFeedback {
    return this.feedbackRepository.create({
      ...dto,
      userId: user.id,
      status: 'New',
    });
  }

  update(id: string, dto: UpdateFeedbackDto, user: IUser): IFeedback {
    this.findById(id);
    if (user.role !== Role.SUPER_USER) {
      throw new ForbiddenException('Only super_user can update feedback status');
    }
    return this.feedbackRepository.update(id, dto)!;
  }
}
