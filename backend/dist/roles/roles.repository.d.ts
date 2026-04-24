import { IRole } from './interfaces/role.interface';
export declare class RolesRepository {
    private readonly roles;
    findAll(): IRole[];
    findById(id: string): IRole | undefined;
    findByRoleId(roleId: string): IRole | undefined;
    create(data: Omit<IRole, 'id' | 'createdAt' | 'updatedAt'>): IRole;
    update(id: string, changes: Partial<IRole>): IRole | undefined;
}
