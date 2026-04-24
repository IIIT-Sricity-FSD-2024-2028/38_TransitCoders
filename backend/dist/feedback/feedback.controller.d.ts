import type { IApiResponse } from '../common/interfaces/api-response.interface';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import type { IFeedback } from './interfaces/feedback.interface';
import type { IUser } from '../users/interfaces/user.interface';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    findAll(user: IUser): IApiResponse<IFeedback[]>;
    create(dto: CreateFeedbackDto, user: IUser): IApiResponse<IFeedback>;
    update(id: string, dto: UpdateFeedbackDto, user: IUser): IApiResponse<IFeedback>;
}
