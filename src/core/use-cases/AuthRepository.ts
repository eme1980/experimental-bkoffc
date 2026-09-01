export interface AuthResult {
  token?: string | null;
  user: {
    id?: string;
    email: string;
  };
}

export interface AuthRepository {
  register(email: string, password: string): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
}