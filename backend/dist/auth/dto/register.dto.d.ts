import { Role } from '../../common/constants/roles.constant';
export declare class RegisterDto {
    name: string;
    email: string;
    password: string;
    role: Role;
    phone?: string;
    company?: string;
    hubId?: string;
}
