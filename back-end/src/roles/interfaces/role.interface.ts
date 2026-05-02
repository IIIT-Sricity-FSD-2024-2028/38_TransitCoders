export interface IRole {
  id: string;
  roleId: string;         // e.g. "super_user"
  name: string;
  description?: string;
  isSystem: boolean;      // system roles cannot be deleted
  permissions: Record<string, boolean>;  // { view_users: true, create_orders: false, ... }
  createdAt: Date;
  updatedAt: Date;
}
