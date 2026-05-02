import { Injectable, NotFoundException } from '@nestjs/common';
import { HubsRepository } from './hubs.repository';
import { CreateHubDto } from './dto/create-hub.dto';
import { UpdateHubDto } from './dto/update-hub.dto';
import { IHub } from './interfaces/hub.interface';

@Injectable()
export class HubsService {
  constructor(private readonly hubsRepository: HubsRepository) {}

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
}
