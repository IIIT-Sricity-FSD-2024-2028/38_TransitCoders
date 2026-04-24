import { OnModuleInit } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { RolesRepository } from '../roles/roles.repository';
export declare class SeedService implements OnModuleInit {
    private readonly usersRepository;
    private readonly rolesRepository;
    constructor(usersRepository: UsersRepository, rolesRepository: RolesRepository);
    onModuleInit(): Promise<void>;
    private seedRoles;
    private seedUsers;
}
