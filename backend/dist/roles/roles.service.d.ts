import { RolesRepository } from './roles.repository';
import { UpdateRoleDto } from './dto/update-role.dto';
import { IRole } from './interfaces/role.interface';
export declare class RolesService {
    private readonly rolesRepository;
    constructor(rolesRepository: RolesRepository);
    findAll(): IRole[];
    findById(id: string): IRole;
    update(id: string, dto: UpdateRoleDto): IRole;
}
