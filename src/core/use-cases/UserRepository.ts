import { ResetUser } from '../entities/User';

export interface UserRepository {
  findByEmail(email: string): Promise<ResetUser | null>;
  findByResetToken(token: string): Promise<ResetUser | null>;
  save(user: ResetUser): Promise<void>;
}