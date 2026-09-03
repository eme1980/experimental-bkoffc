import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResetPassword } from '../../../src/core/use-cases/ResetPassword';

describe('ResetPassword Use Case', () => {
  let authResetRepository: any;
  let resetPassword: ResetPassword;

  beforeEach(() => {
    authResetRepository = {
      sendResetPasswordEmail: vi.fn(),
      resetPassword: vi.fn(),
    };
    resetPassword = new ResetPassword(authResetRepository);
  });

  it('should delegate to authResetRepository.resetPassword with otp (token) and new password', async () => {
    await resetPassword.execute('otp-token', 'NewPassword123');

    expect(authResetRepository.resetPassword).toHaveBeenCalledWith(
      'NewPassword123',
      'otp-token',
    );
  });
});