import { AuthRepository, AuthResult } from '../../core/use-cases/AuthRepository';
import { insforgeClient } from '../insforge/client';

export class InsForgeAuthRepository implements AuthRepository {
  async register(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await insforgeClient.auth.signUp({ email, password });

    if (error) {
      throw new Error(error.message || 'Registration failed');
    }

    return {
      token: data?.accessToken ?? null,
      user: {
        id: data?.user?.id,
        email: data?.user?.email ?? email,
      },
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await insforgeClient.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error(error.message || 'Invalid credentials');
    }

    return {
      token: data?.accessToken ?? null,
      user: {
        id: data?.user?.id,
        email: data?.user?.email ?? email,
      },
    };
  }
}