import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestPasswordReset } from '../../../src/core/use-cases/RequestPasswordReset';

// Mock del módulo crypto para verificar que se usa randomBytes
vi.mock('crypto', () => ({
  randomBytes: vi.fn(),
}));
import { randomBytes } from 'crypto';

describe('RequestPasswordReset Use Case', () => {
  let userRepository: any;
  let emailService: any;
  let requestPasswordReset: RequestPasswordReset;

  beforeEach(() => {
    userRepository = {
      findByEmail: vi.fn(),
      save: vi.fn(),
    };
    emailService = {
      sendResetEmail: vi.fn(),
    };
    requestPasswordReset = new RequestPasswordReset(userRepository, emailService);
  });

  it('should generate a token and send an email when the user exists', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);
    vi.mocked(randomBytes).mockReturnValue(Buffer.from('a1b2c3d4e5f6a1b2c3d4e5f6', 'hex'));

    await requestPasswordReset.execute('test@example.com');

    // El token debe generarse con crypto.randomBytes (criptográficamente seguro)
    expect(randomBytes).toHaveBeenCalled();
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '123',
        resetToken: expect.any(String),
        resetTokenExpires: expect.any(Date),
      })
    );
    expect(emailService.sendResetEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.any(String)
    );
  });

  it('should generate a different token each call (crypto random)', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);
    vi.mocked(randomBytes)
      .mockReturnValueOnce(Buffer.from('aa', 'hex'))
      .mockReturnValueOnce(Buffer.from('bb', 'hex'));

    await requestPasswordReset.execute('test@example.com');
    await requestPasswordReset.execute('test@example.com');

    const calls = vi.mocked(userRepository.save).mock.calls;
    expect(calls[0][0].resetToken).toBe('aa');
    expect(calls[1][0].resetToken).toBe('bb');
    expect(calls[0][0].resetToken).not.toBe(calls[1][0].resetToken);
  });

  it('should throw an error when the user does not exist', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(requestPasswordReset.execute('unknown@example.com'))
      .rejects.toThrow('User not found');
  });
});
