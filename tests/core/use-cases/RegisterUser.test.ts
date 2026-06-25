import { describe, it, expect, vi } from 'vitest';
import { RegisterUser } from '../../../src/core/use-cases/RegisterUser';
import { UserRepository } from '../../../src/core/use-cases/UserRepository';

describe('RegisterUser Use Case', () => {
  // Mock del repositorio
  const mockUserRepository: UserRepository = {
    findByEmail: vi.fn(),
    save: vi.fn(),
  };

  it('should register a new user successfully', async () => {
    // Arrange: Usuario no existe
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(mockUserRepository.save).mockResolvedValue({ 
      email: 'test@example.com', 
      password: 'Password123!' 
    });

    const useCase = new RegisterUser(mockUserRepository);
    const result = await useCase.execute('test@example.com', 'Password123!');

    expect(result.email).toBe('test@example.com');
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it('should throw an error if the user already exists', async () => {
    // Arrange: Usuario ya existe
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({ 
      email: 'test@example.com', 
      password: 'somepassword' 
    });

    const useCase = new RegisterUser(mockUserRepository);
    
    await expect(useCase.execute('test@example.com', 'Password123!'))
      .rejects.toThrow('User already exists');
  });
});
