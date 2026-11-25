import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../common/database/database.service';
import { AGENT_TASK_CAPACITY, IAgentProfile } from './interfaces/agent.interface';

const LIVE_AGENTS = `SELECT a.*,
  (SELECT COUNT(*) FROM orders o WHERE o.assignedAgentId = a.userId
   AND o.status NOT IN ('Delivered', 'Cancelled', 'Returned', 'Failed')) AS activeTasks
  FROM agents a`;

/**
 * AgentsRepository — durable SQLite-backed agent-profile store.
 * Same method contract as the previous in-memory implementation.
 */
@Injectable()
export class AgentsRepository {
  constructor(private readonly db: DatabaseService) {}

  private toAgent(row: any): IAgentProfile {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name ?? '',
      phone: row.phone ?? undefined,
      hubId: row.hubId ?? '',
      availabilityStatus: row.availabilityStatus ?? 'Available',
      vehicleType: row.vehicleType ?? undefined,
      currentTasksCount: Number(row.activeTasks) || 0,
      taskCapacity: AGENT_TASK_CAPACITY,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  findAll(): IAgentProfile[] {
    return this.db.query(`${LIVE_AGENTS} ORDER BY a.createdAt`).map((r) => this.toAgent(r));
  }

  findById(id: string): IAgentProfile | undefined {
    const row = this.db.queryOne(`${LIVE_AGENTS} WHERE a.id = ?`, [id]);
    return row ? this.toAgent(row) : undefined;
  }

  findByUserId(userId: string): IAgentProfile | undefined {
    const row = this.db.queryOne(`${LIVE_AGENTS} WHERE a.userId = ?`, [userId]);
    return row ? this.toAgent(row) : undefined;
  }

  findByHub(hubId: string): IAgentProfile[] {
    return this.db
      .query(`${LIVE_AGENTS} JOIN users u ON a.userId = u.id
              WHERE a.hubId = ? AND u.role = 'delivery_agent' AND u.isActive = 1
              ORDER BY activeTasks, a.createdAt, a.userId`, [hubId])
      .map((r) => this.toAgent(r));
  }

  create(data: Omit<IAgentProfile, 'id' | 'createdAt' | 'updatedAt'>): IAgentProfile {
    const agent: IAgentProfile = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.db.run(
      `INSERT INTO agents (id, userId, name, phone, hubId, availabilityStatus, vehicleType, currentTasksCount, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        agent.id,
        agent.userId,
        agent.name ?? null,
        agent.phone ?? null,
        agent.hubId ?? null,
        agent.availabilityStatus ?? 'Available',
        agent.vehicleType ?? null,
        agent.currentTasksCount ?? 0,
        agent.createdAt.toISOString(),
        agent.updatedAt.toISOString(),
      ],
    );
    return agent;
  }

  update(id: string, changes: Partial<IAgentProfile>): IAgentProfile | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const merged: IAgentProfile = { ...existing, ...changes, updatedAt: new Date() };
    this.db.run(
      `UPDATE agents SET userId = ?, name = ?, phone = ?, hubId = ?, availabilityStatus = ?, vehicleType = ?, currentTasksCount = ?, updatedAt = ?
       WHERE id = ?`,
      [
        merged.userId,
        merged.name ?? null,
        merged.phone ?? null,
        merged.hubId ?? null,
        merged.availabilityStatus ?? 'Available',
        merged.vehicleType ?? null,
        merged.currentTasksCount ?? 0,
        merged.updatedAt.toISOString(),
        id,
      ],
    );
    return merged;
  }

  delete(id: string): boolean {
    const result = this.db.run('DELETE FROM agents WHERE id = ?', [id]);
    return result.changes > 0;
  }
}
