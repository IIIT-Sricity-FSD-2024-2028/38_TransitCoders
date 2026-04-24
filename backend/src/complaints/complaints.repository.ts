import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IComplaint } from './interfaces/complaint.interface';

// ODDT-301 — ComplaintsRepository
@Injectable()
export class ComplaintsRepository {
  private readonly complaints = new Map<string, IComplaint>();

  findAll(): IComplaint[] {
    return Array.from(this.complaints.values());
  }

  findById(id: string): IComplaint | undefined {
    return this.complaints.get(id);
  }

  findByUser(userId: string): IComplaint[] {
    return Array.from(this.complaints.values()).filter(
      (c) => c.userId === userId,
    );
  }

  create(data: Omit<IComplaint, 'id' | 'createdAt' | 'updatedAt'>): IComplaint {
    const complaint: IComplaint = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.complaints.set(complaint.id, complaint);
    return complaint;
  }

  update(id: string, changes: Partial<IComplaint>): IComplaint | undefined {
    const complaint = this.complaints.get(id);
    if (!complaint) return undefined;
    const updated = { ...complaint, ...changes, updatedAt: new Date() };
    this.complaints.set(id, updated);
    return updated;
  }
}
