export interface IRole {
    id: string;
    roleId: string;
    name: string;
    description?: string;
    isSystem: boolean;
    permissions: Record<string, boolean>;
    createdAt: Date;
    updatedAt: Date;
}
