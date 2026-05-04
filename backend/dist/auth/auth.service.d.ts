import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    login(dto: LoginDto): Promise<{
        token: string;
        user: object;
    }>;
    register(dto: RegisterDto): Promise<object>;
    logout(token: string): void;
}
