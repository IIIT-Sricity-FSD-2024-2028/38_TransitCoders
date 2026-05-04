import type { IApiResponse } from '../common/interfaces/api-response.interface';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { IUser, ISafeUser } from './interfaces/user.interface';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): IApiResponse<ISafeUser[]>;
    findById(id: string): IApiResponse<ISafeUser>;
    create(dto: CreateUserDto): Promise<IApiResponse<ISafeUser>>;
    update(id: string, dto: UpdateUserDto): Promise<IApiResponse<ISafeUser>>;
    delete(id: string, user: IUser): IApiResponse<null>;
    approve(id: string): IApiResponse<ISafeUser>;
}
