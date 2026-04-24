import type { IApiResponse } from '../common/interfaces/api-response.interface';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { IUser } from './interfaces/user.interface';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): IApiResponse<IUser[]>;
    findById(id: string): IApiResponse<IUser>;
    create(dto: CreateUserDto): Promise<IApiResponse<IUser>>;
    update(id: string, dto: UpdateUserDto): Promise<IApiResponse<IUser>>;
    delete(id: string, user: IUser): IApiResponse<null>;
    approve(id: string): IApiResponse<IUser>;
}
