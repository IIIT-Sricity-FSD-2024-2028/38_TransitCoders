import { Role } from '../../common/constants/roles.constant';

export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string; // bcrypt hashed
  role: Role;
  hubId?: string;       // hub_manager and delivery_agent
  phone?: string;
  company?: string;     // merchant
  isActive: boolean;
  authToken?: string;   // set on login, cleared on logout
  createdAt: Date;
  updatedAt: Date;
}
