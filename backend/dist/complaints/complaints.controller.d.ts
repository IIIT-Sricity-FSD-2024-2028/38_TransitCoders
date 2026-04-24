import type { IApiResponse } from '../common/interfaces/api-response.interface';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import type { IComplaint } from './interfaces/complaint.interface';
import type { IUser } from '../users/interfaces/user.interface';
export declare class ComplaintsController {
    private readonly complaintsService;
    constructor(complaintsService: ComplaintsService);
    findAll(user: IUser): IApiResponse<IComplaint[]>;
    create(dto: CreateComplaintDto, user: IUser): IApiResponse<IComplaint>;
    update(id: string, dto: UpdateComplaintDto, user: IUser): IApiResponse<IComplaint>;
}
