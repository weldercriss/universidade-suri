import { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  listAll(): Promise<User[]>;
  listLeaderboard(groupType?: string): Promise<User[]>;
}
export const IUserRepository = Symbol('IUserRepository');
