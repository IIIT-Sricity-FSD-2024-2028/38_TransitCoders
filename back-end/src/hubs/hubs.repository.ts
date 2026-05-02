import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IHub } from './interfaces/hub.interface';

@Injectable()
export class HubsRepository {
  private hubs = new Map<string, IHub>();

  findAll(): IHub[] {
    return Array.from(this.hubs.values());
  }

  findById(id: string): IHub | undefined {
    return this.hubs.get(id);
  }

  findByHubId(hubId: string): IHub | undefined {
    return Array.from(this.hubs.values()).find(h => h.hubId === hubId);
  }

  create(data: Omit<IHub, 'id' | 'createdAt' | 'updatedAt'>): IHub {
    const hub: IHub = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.hubs.set(hub.id, hub);
    return hub;
  }

  update(id: string, changes: Partial<IHub>): IHub | undefined {
    const hub = this.hubs.get(id);
    if (!hub) return undefined;
    const updated = { ...hub, ...changes, updatedAt: new Date() };
    this.hubs.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.hubs.delete(id);
  }
}
