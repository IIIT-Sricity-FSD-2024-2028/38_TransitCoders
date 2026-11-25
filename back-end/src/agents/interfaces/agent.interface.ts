export const AGENT_TASK_CAPACITY = 8;

export interface IAgentProfile {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  hubId: string;
  availabilityStatus: 'Available' | 'Busy' | 'Offline';
  vehicleType?: string;
  currentTasksCount: number;
  taskCapacity?: number;
  createdAt: Date;
  updatedAt: Date;
}
