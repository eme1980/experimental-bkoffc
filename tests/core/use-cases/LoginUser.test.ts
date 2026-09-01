import { describe, it, expect, vi } from 'vitest';
import { LoginUser } from '../../../src/core/use-cases/LoginUser';
import { AuthRepository } from '../../../src/core/use-cases/AuthRepository';

describe('LoginUser Use Case', () => {
  const mockAuthRepository: AuthRepository = {
    register: vi.fn(),
    login: vi.fn(),
  };

  it('should log in an existing user successfully', async () => {
    vi.mocked(mockAuthRepository.login).mockResolvedValue({
      token: 'session-token',
      user: { id: 'user-1', email: 'test@example.com' },
    });

    const useCase = new LoginUser(mockAuthRepository);
    const result = await useCase.execute('test@example.com', 'Password123!');

    expect(result.user.email).toBe('test@example.com');
    expect(result.token).toBe('session-token');
    expect(mockAuthRepository.login).toHaveBeenCalledWith('test@example.com', 'Password123!');
  });

  it('should propagate an error when credentials are invalid', async () => {
    vi.mocked(mockAuthRepository.login).mockRejectedValue(new Error('Invalid credentials'));

    const useCase = new LoginUser(mockAuthRepository);

    await expect(useCase.execute('test@example.com', 'wrongpassword'))
      .rejects.toThrow('Invalid credentials');
  });
});