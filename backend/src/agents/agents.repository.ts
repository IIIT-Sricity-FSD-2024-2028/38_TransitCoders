import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IAgentProfile } from './interfaces/agent.interface';

@Injectable()
export class AgentsRepository {
  private readonly agents = new Map<string, IAgentProfile>();

  findAll(): IAgentProfile[] {
    return Array.from(this.agents.values());
  }

  findById(id: string): IAgentProfile | undefined {
    return this.agents.get(id);
  }

  findByUserId(userId: string): IAgentProfile | undefined {
    return this.findAll().find(agent => agent.userId === userId);
  }

  findByHub(hubId: string): IAgentProfile[] {
    return this.findAll().filter(agent => agent.hubId === hubId);
  }

  create(agent: Omit<IAgentProfile, 'id' | 'createdAt' | 'updatedAt' | 'currentTasksCount'>): IAgentProfile {
    const id = uuidv4();
    const newAgent: IAgentProfile = {
      ...agent,
      id,
      currentTasksCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.agents.set(id, newAgent);
    return newAgent;
  }

  update(id: string, changes: Partial<IAgentProfile>): IAgentProfile | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      ...changes,
      updatedAt: new Date(),
    };
    this.agents.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.agents.delete(id);
  }
}
