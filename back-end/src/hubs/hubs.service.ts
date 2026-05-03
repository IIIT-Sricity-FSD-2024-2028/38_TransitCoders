import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { HubsRepository } from './hubs.repository';
import { AgentsRepository } from '../agents/agents.repository';
import { CreateHubDto } from './dto/create-hub.dto';
import { UpdateHubDto } from './dto/update-hub.dto';
import { IHub } from './interfaces/hub.interface';
import { IAgentProfile } from '../agents/interfaces/agent.interface';

@Injectable()
export class HubsService {
  constructor(
    private readonly hubsRepository: HubsRepository,
    @Inject(forwardRef(() => AgentsRepository))
    private readonly agentsRepository: AgentsRepository,
  ) {}

  findAll(): IHub[] {
    return this.hubsRepository.findAll();
  }

  findById(id: string): IHub {
    const hub = this.hubsRepository.findById(id) ?? this.hubsRepository.findByHubId(id);
    if (!hub) throw new NotFoundException(`Hub ${id} not found`);
    return hub;
  }

  create(dto: CreateHubDto): IHub {
    return this.hubsRepository.create({
      ...dto,
      currentLoad: 0,
      managerId: dto.managerId ?? null,
      status: dto.status ?? 'active',
      phone: dto.phone ?? '',
      email: dto.email ?? '',
      capacity: dto.capacity ?? 100,
    });
  }

  update(id: string, dto: UpdateHubDto): IHub {
    const hub = this.findById(id);
    const updated = this.hubsRepository.update(hub.id, dto);
    if (!updated) throw new NotFoundException(`Hub ${id} not found`);
    return updated;
  }

  delete(id: string): void {
    const hub = this.findById(id);
    const deleted = this.hubsRepository.delete(hub.id);
    if (!deleted) throw new NotFoundException(`Hub ${id} not found`);
  }

  /**
   * ST-014 subtask 14.2 — Get all delivery agents assigned to a hub.
   * Requires AgentsModule to be imported by HubsModule.
   * Resolves to the hub's `hubId` code (e.g. 'H001') since agents store that string.
   */
  getAgentsForHub(hubId: string): IAgentProfile[] {
    // Verify hub exists and resolve to the hub's code string
    const hub = this.findById(hubId);
    return this.agentsRepository.findByHub(hub.hubId);
  }
}

