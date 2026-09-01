import { describe, it, expect, vi } from 'vitest';
import { RegisterUser } from '../../../src/core/use-cases/RegisterUser';
import { AuthRepository } from '../../../src/core/use-cases/AuthRepository';

describe('RegisterUser Use Case', () => {
  const mockAuthRepository: AuthRepository = {
    register: vi.fn(),
    login: vi.fn(),
  };

  it('should register a new user successfully', async () => {
    vi.mocked(mockAuthRepository.register).mockResolvedValue({
      token: 'session-token',
      user: { id: 'user-1', email: 'test@example.com' },
    });

    const useCase = new RegisterUser(mockAuthRepository);
    const result = await useCase.execute('test@example.com', 'Password123!');

    expect(result.user.email).toBe('test@example.com');
    expect(result.token).toBe('session-token');
    expect(mockAuthRepository.register).toHaveBeenCalledWith('test@example.com', 'Password123!');
  });

  it('should propagate an error when registration fails', async () => {
    vi.mocked(mockAuthRepository.register).mockRejectedValue(new Error('Registration failed'));

    const useCase = new RegisterUser(mockAuthRepository);

    await expect(useCase.execute('test@example.com', 'Password123!'))
      .rejects.toThrow('Registration failed');
  });
});