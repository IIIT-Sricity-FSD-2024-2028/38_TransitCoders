import { FeedbackRepository } from './feedback.repository';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { IFeedback } from './interfaces/feedback.interface';
import { IUser } from '../users/interfaces/user.interface';
export declare class FeedbackService {
    private readonly feedbackRepository;
    constructor(feedbackRepository: FeedbackRepository);
    findAll(user: IUser): IFeedback[];
    findById(id: string): IFeedback;
    create(dto: CreateFeedbackDto, user: IUser): IFeedback;
    update(id: string, dto: UpdateFeedbackDto, user: IUser): IFeedback;
}
