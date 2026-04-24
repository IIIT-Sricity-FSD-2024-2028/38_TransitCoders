import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import type { IApiResponse } from '../common/interfaces/api-response.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<IApiResponse<{
        token: string;
        user: object;
    }>>;
    register(dto: CreateUserDto): Promise<IApiResponse<object>>;
    logout(token: string): IApiResponse<null>;
}
