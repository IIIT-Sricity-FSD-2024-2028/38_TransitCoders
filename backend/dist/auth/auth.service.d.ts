import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
export declare class AuthService {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    login(dto: LoginDto): Promise<{
        token: string;
        user: object;
    }>;
    register(dto: CreateUserDto): Promise<object>;
    logout(token: string): void;
}
