import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InsForgeAuthRepository } from '../../../src/infrastructure/repositories/InsForgeAuthRepository';
import { insforgeClient } from '../../../src/infrastructure/insforge/client';

vi.mock('../../../src/infrastructure/insforge/client', () => ({
  insforgeClient: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}));

describe('InsForgeAuthRepository', () => {
  let repo: InsForgeAuthRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new InsForgeAuthRepository();
  });

  describe('register', () => {
    it('should call auth.signUp and map the returned token and user', async () => {
      vi.mocked(insforgeClient.auth.signUp).mockResolvedValue({
        data: {
          accessToken: 'tok-abc',
          user: { id: 'u1', email: 'new@example.com' },
        },
        error: null,
      } as any);

      const result = await repo.register('new@example.com', 'Password123!');

      expect(insforgeClient.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'Password123!',
      });
      expect(result).toEqual({
        token: 'tok-abc',
        user: { id: 'u1', email: 'new@example.com' },
      });
    });

    it('should fall back to the request email when the user object lacks one', async () => {
      vi.mocked(insforgeClient.auth.signUp).mockResolvedValue({
        data: { accessToken: 'tok-x', user: { id: 'u2' } },
        error: null,
      } as any);

      const result = await repo.register('fallback@example.com', 'Password123!');

      expect(result.user.email).toBe('fallback@example.com');
    });

    it('should map accessToken to null when the SDK returns none', async () => {
      vi.mocked(insforgeClient.auth.signUp).mockResolvedValue({
        data: { accessToken: null, user: { id: 'u3', email: 't@example.com' } },
        error: null,
      } as any);

      const result = await repo.register('t@example.com', 'Password123!');

      expect(result.token).toBeNull();
    });

    it('should throw when signUp returns an error', async () => {
      vi.mocked(insforgeClient.auth.signUp).mockResolvedValue({
        data: null,
        error: { message: 'email exists' },
      } as any);

      await expect(repo.register('dup@example.com', 'Password123!')).rejects.toThrow(
        'email exists',
      );
    });

    it('should throw a generic message when signUp error has no message', async () => {
      vi.mocked(insforgeClient.auth.signUp).mockResolvedValue({
        data: null,
        error: {},
      } as any);

      await expect(repo.register('x@example.com', 'Password123!')).rejects.toThrow(
        'Registration failed',
      );
    });
  });

  describe('login', () => {
    it('should call signInWithPassword and map the returned token and user', async () => {
      vi.mocked(insforgeClient.auth.signInWithPassword).mockResolvedValue({
        data: {
          accessToken: 'tok-login',
          user: { id: 'u9', email: 'known@example.com' },
        },
        error: null,
      } as any);

      const result = await repo.login('known@example.com', 'Password123!');

      expect(insforgeClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'known@example.com',
        password: 'Password123!',
      });
      expect(result).toEqual({
        token: 'tok-login',
        user: { id: 'u9', email: 'known@example.com' },
      });
    });

    it('should map accessToken to null and fall back to request email when SDK omits them', async () => {
      vi.mocked(insforgeClient.auth.signInWithPassword).mockResolvedValue({
        data: { accessToken: null, user: { id: 'u9' } },
        error: null,
      } as any);

      const result = await repo.login('known@example.com', 'Password123!');

      expect(result.token).toBeNull();
      expect(result.user.email).toBe('known@example.com');
    });

    it('should throw when signInWithPassword returns an error', async () => {
      vi.mocked(insforgeClient.auth.signInWithPassword).mockResolvedValue({
        data: null,
        error: { message: 'bad credentials' },
      } as any);

      await expect(repo.login('a@b.com', 'WrongPass!1')).rejects.toThrow('bad credentials');
    });

    it('should use a generic message when login error has no message', async () => {
      vi.mocked(insforgeClient.auth.signInWithPassword).mockResolvedValue({
        data: null,
        error: {},
      } as any);

      await expect(repo.login('a@b.com', 'WrongPass!1')).rejects.toThrow('Invalid credentials');
    });
  });
});