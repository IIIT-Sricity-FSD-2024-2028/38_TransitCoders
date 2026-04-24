import { IFeedback } from './interfaces/feedback.interface';
export declare class FeedbackRepository {
    private readonly feedbacks;
    findAll(): IFeedback[];
    findById(id: string): IFeedback | undefined;
    findByUser(userId: string): IFeedback[];
    create(data: Omit<IFeedback, 'id' | 'createdAt'>): IFeedback;
    update(id: string, changes: Partial<IFeedback>): IFeedback | undefined;
}
