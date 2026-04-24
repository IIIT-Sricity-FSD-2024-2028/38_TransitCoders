import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    findAll(): IUser[];
    findById(id: string): IUser;
    create(dto: CreateUserDto): Promise<IUser>;
    update(id: string, dto: UpdateUserDto): Promise<IUser>;
    delete(id: string, requesterId: string): void;
    approve(id: string): IUser;
}
