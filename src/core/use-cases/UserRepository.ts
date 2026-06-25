export interface UserRepository {
  findByEmail(email: string): Promise<any | null>;
  findByResetToken(token: string): Promise<any | null>;
  save(user: any): Promise<void>;
}
