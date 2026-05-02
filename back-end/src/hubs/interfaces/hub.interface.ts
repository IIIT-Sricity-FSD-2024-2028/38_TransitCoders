export interface IHub {
  id: string;
  hubId: string;         // e.g. "H001"
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  managerId: string | null;
  status: 'active' | 'inactive' | 'maintenance';
  capacity: number;
  currentLoad: number;
  createdAt: Date;
  updatedAt: Date;
}
