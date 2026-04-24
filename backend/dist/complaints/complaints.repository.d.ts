import { IComplaint } from './interfaces/complaint.interface';
export declare class ComplaintsRepository {
    private readonly complaints;
    findAll(): IComplaint[];
    findById(id: string): IComplaint | undefined;
    findByUser(userId: string): IComplaint[];
    create(data: Omit<IComplaint, 'id' | 'createdAt' | 'updatedAt'>): IComplaint;
    update(id: string, changes: Partial<IComplaint>): IComplaint | undefined;
}
