import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ISafeUser } from './interfaces/user.interface';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    private sanitize;
    findAll(): ISafeUser[];
    findById(id: string): ISafeUser;
    create(dto: CreateUserDto): Promise<ISafeUser>;
    update(id: string, dto: UpdateUserDto): Promise<ISafeUser>;
    delete(id: string, requesterId: string): void;
    approve(id: string): ISafeUser;
}
