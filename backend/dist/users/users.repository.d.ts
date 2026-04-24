import { IUser } from './interfaces/user.interface';
export declare class UsersRepository {
    private readonly users;
    findAll(): IUser[];
    findById(id: string): IUser | undefined;
    findByEmail(email: string): IUser | undefined;
    findByToken(token: string): IUser | undefined;
    create(data: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): IUser;
    update(id: string, changes: Partial<IUser>): IUser | undefined;
    delete(id: string): boolean;
}
