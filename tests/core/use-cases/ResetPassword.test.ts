import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResetPassword } from '../../../src/core/use-cases/ResetPassword';

const SHA256_VALID_TOKEN =
  '397a2a9c5bf5e2ccec38c2596b682bb1bd05fe6e4ecea6c10cf42755ff225403';

describe('ResetPassword Use Case', () => {
  let userRepository: any;
  let resetPassword: ResetPassword;

  beforeEach(() => {
    userRepository = {
      findByResetToken: vi.fn(),
      save: vi.fn(),
    };
    resetPassword = new ResetPassword(userRepository);
  });

  it('should look up the user by the sha256 hash of the token, never by the raw token', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      resetToken: SHA256_VALID_TOKEN,
      resetTokenExpires: new Date(Date.now() + 3600000),
    };
    vi.mocked(userRepository.findByResetToken).mockResolvedValue(mockUser);

    await resetPassword.execute('valid-token', 'newSecurePassword123');

    expect(userRepository.findByResetToken).toHaveBeenCalledWith(SHA256_VALID_TOKEN);
  });

  it('should update password and clear token when the token is valid', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      resetToken: SHA256_VALID_TOKEN,
      resetTokenExpires: new Date(Date.now() + 3600000), // Expira en 1 hora
    };
    vi.mocked(userRepository.findByResetToken).mockResolvedValue(mockUser);

    await resetPassword.execute('valid-token', 'newSecurePassword123');

    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '123',
        password: 'newSecurePassword123',
        resetToken: null,
        resetTokenExpires: null,
      })
    );
  });

  it('should throw Password too short when the new password has less than 8 characters', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      resetToken: SHA256_VALID_TOKEN,
      resetTokenExpires: new Date(Date.now() + 3600000),
    };
    vi.mocked(userRepository.findByResetToken).mockResolvedValue(mockUser);

    await expect(resetPassword.execute('valid-token', 'short')).rejects.toThrow(
      'Password too short'
    );
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('should throw an error when token is not found', async () => {
    vi.mocked(userRepository.findByResetToken).mockResolvedValue(null);

    await expect(resetPassword.execute('invalid-token', 'newPassword123'))
      .rejects.toThrow('Invalid or expired token');
  });

  it('should throw an error when token has expired', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      resetToken: SHA256_VALID_TOKEN,
      resetTokenExpires: new Date(Date.now() - 3600000), // Expiró hace 1 hora
    };
    vi.mocked(userRepository.findByResetToken).mockResolvedValue(mockUser);

    await expect(resetPassword.execute('expired-token', 'newPassword123'))
      .rejects.toThrow('Invalid or expired token');
  });
});