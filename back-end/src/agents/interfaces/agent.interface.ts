export interface IAgentProfile {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  hubId: string;
  availabilityStatus: 'Available' | 'Busy' | 'Offline';
  vehicleType?: string;
  currentTasksCount: number;
  createdAt: Date;
  updatedAt: Date;
}
