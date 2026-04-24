import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IFeedback } from './interfaces/feedback.interface';

// ODDT-306 — FeedbackRepository
@Injectable()
export class FeedbackRepository {
  private readonly feedbacks = new Map<string, IFeedback>();

  findAll(): IFeedback[] {
    return Array.from(this.feedbacks.values());
  }

  findById(id: string): IFeedback | undefined {
    return this.feedbacks.get(id);
  }

  findByUser(userId: string): IFeedback[] {
    return Array.from(this.feedbacks.values()).filter(
      (f) => f.userId === userId,
    );
  }

  create(data: Omit<IFeedback, 'id' | 'createdAt'>): IFeedback {
    const feedback: IFeedback = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.feedbacks.set(feedback.id, feedback);
    return feedback;
  }

  update(id: string, changes: Partial<IFeedback>): IFeedback | undefined {
    const feedback = this.feedbacks.get(id);
    if (!feedback) return undefined;
    const updated = { ...feedback, ...changes };
    this.feedbacks.set(id, updated);
    return updated;
  }
}
