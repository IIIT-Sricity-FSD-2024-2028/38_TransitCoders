import { Role } from '../../common/constants/roles.constant';
export declare class CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: Role;
    hubId?: string;
    phone?: string;
    company?: string;
}
