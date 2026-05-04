import type { IApiResponse } from '../common/interfaces/api-response.interface';
import { RolesService } from './roles.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import type { IRole } from './interfaces/role.interface';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAll(): IApiResponse<IRole[]>;
    findById(id: string): IApiResponse<IRole>;
    update(id: string, dto: UpdateRoleDto): IApiResponse<IRole>;
}
