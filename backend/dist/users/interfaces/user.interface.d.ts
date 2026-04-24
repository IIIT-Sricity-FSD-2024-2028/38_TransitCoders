import { Role } from '../../common/constants/roles.constant';
export interface IUser {
    id: string;
    name: string;
    email: string;
    password: string;
    role: Role;
    hubId?: string;
    phone?: string;
    company?: string;
    isActive: boolean;
    authToken?: string;
    createdAt: Date;
    updatedAt: Date;
}
