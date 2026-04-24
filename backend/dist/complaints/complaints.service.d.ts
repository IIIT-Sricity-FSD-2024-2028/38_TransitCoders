import { ComplaintsRepository } from './complaints.repository';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { IComplaint } from './interfaces/complaint.interface';
import { IUser } from '../users/interfaces/user.interface';
export declare class ComplaintsService {
    private readonly complaintsRepository;
    constructor(complaintsRepository: ComplaintsRepository);
    findAll(user: IUser): IComplaint[];
    findById(id: string): IComplaint;
    create(dto: CreateComplaintDto, user: IUser): IComplaint;
    update(id: string, dto: UpdateComplaintDto, user: IUser): IComplaint;
}
