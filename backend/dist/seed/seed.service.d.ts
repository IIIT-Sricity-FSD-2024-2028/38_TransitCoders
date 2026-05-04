import { OnModuleInit } from '@nestjs/common';
import { UsersRepository } from '../users/users.repository';
import { RolesRepository } from '../roles/roles.repository';
import { AgentsRepository } from '../agents/agents.repository';
export declare class SeedService implements OnModuleInit {
    private readonly usersRepository;
    private readonly rolesRepository;
    private readonly agentsRepository;
    constructor(usersRepository: UsersRepository, rolesRepository: RolesRepository, agentsRepository: AgentsRepository);
    onModuleInit(): Promise<void>;
    private seedRoles;
    private seedUsers;
}
