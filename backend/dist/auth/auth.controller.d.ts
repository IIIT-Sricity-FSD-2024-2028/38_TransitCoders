import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { IApiResponse } from '../common/interfaces/api-response.interface';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<IApiResponse<object>>;
    login(dto: LoginDto): Promise<IApiResponse<{
        token: string;
        user: object;
    }>>;
    logout(token: string): IApiResponse<null>;
}
