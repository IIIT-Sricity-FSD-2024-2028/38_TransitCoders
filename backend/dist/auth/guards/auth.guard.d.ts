import { CanActivate, ExecutionContext } from '@nestjs/common';
import { UsersRepository } from '../../users/users.repository';
export declare class AuthGuard implements CanActivate {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
