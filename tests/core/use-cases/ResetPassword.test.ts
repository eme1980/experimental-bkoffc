import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResetPassword } from '/opt/data/experimental-bkoffc/src/core/use-cases/ResetPassword';

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

  it('should update password and clear token when token is valid', async () => {
    const mockUser = { 
      id: '123', 
      email: 'test@example.com', 
      resetToken: 'valid-token', 
      resetTokenExpires: new Date(Date.now() + 3600000) // Expira en 1 hora
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

  it('should throw an error when token is not found', async () => {
    vi.mocked(userRepository.findByResetToken).mockResolvedValue(null);

    await expect(resetPassword.execute('invalid-token', 'newPassword'))
      .rejects.toThrow('Invalid or expired token');
  });

  it('should throw an error when token has expired', async () => {
    const mockUser = { 
      id: '123', 
      email: 'test@example.com', 
      resetToken: 'expired-token', 
      resetTokenExpires: new Date(Date.now() - 3600000) // Expiró hace 1 hora
    };
    vi.mocked(userRepository.findByResetToken).mockResolvedValue(mockUser);

    await expect(resetPassword.execute('expired-token', 'newPassword'))
      .rejects.toThrow('Invalid or expired token');
  });
});
