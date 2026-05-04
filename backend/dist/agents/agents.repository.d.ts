import { IAgentProfile } from './interfaces/agent.interface';
export declare class AgentsRepository {
    private readonly agents;
    findAll(): IAgentProfile[];
    findById(id: string): IAgentProfile | undefined;
    findByUserId(userId: string): IAgentProfile | undefined;
    findByHub(hubId: string): IAgentProfile[];
    create(agent: Omit<IAgentProfile, 'id' | 'createdAt' | 'updatedAt' | 'currentTasksCount'>): IAgentProfile;
    update(id: string, changes: Partial<IAgentProfile>): IAgentProfile | undefined;
    delete(id: string): boolean;
}
