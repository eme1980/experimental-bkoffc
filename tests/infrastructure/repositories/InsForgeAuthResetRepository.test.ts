import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InsForgeAuthResetRepository } from '../../../src/infrastructure/repositories/InsForgeAuthResetRepository';
import { insforgeClient } from '../../../src/infrastructure/insforge/client';

vi.mock('../../../src/infrastructure/insforge/client', () => ({
  insforgeClient: {
    auth: {
      sendResetPasswordEmail: vi.fn(),
      resetPassword: vi.fn(),
    },
  },
}));

describe('InsForgeAuthResetRepository', () => {
  let repo: InsForgeAuthResetRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new InsForgeAuthResetRepository();
  });

  describe('sendResetPasswordEmail', () => {
    it('should call auth.sendResetPasswordEmail with email and redirectTo', async () => {
      vi.mocked(insforgeClient.auth.sendResetPasswordEmail).mockResolvedValue({
        data: { success: true, message: 'sent' },
        error: null,
      } as any);

      await repo.sendResetPasswordEmail('user@example.com', 'https://app.example.com/reset-password');

      expect(insforgeClient.auth.sendResetPasswordEmail).toHaveBeenCalledWith({
        email: 'user@example.com',
        redirectTo: 'https://app.example.com/reset-password',
      });
    });

    it('should omit redirectTo when not provided', async () => {
      vi.mocked(insforgeClient.auth.sendResetPasswordEmail).mockResolvedValue({
        data: { success: true, message: 'sent' },
        error: null,
      } as any);

      await repo.sendResetPasswordEmail('user@example.com');

      expect(insforgeClient.auth.sendResetPasswordEmail).toHaveBeenCalledWith({
        email: 'user@example.com',
        redirectTo: undefined,
      });
    });

    it('should throw when the SDK returns an error', async () => {
      vi.mocked(insforgeClient.auth.sendResetPasswordEmail).mockResolvedValue({
        data: null,
        error: { message: 'send failed' },
      } as any);

      await expect(repo.sendResetPasswordEmail('a@b.com')).rejects.toThrow('send failed');
    });

    it('should throw a generic message when error has no message', async () => {
      vi.mocked(insforgeClient.auth.sendResetPasswordEmail).mockResolvedValue({
        data: null,
        error: {},
      } as any);

      await expect(repo.sendResetPasswordEmail('a@b.com')).rejects.toThrow(
        'Failed to request password reset',
      );
    });
  });

  describe('resetPassword', () => {
    it('should call auth.resetPassword with newPassword and otp (token)', async () => {
      vi.mocked(insforgeClient.auth.resetPassword).mockResolvedValue({
        data: { message: 'password updated' },
        error: null,
      } as any);

      await repo.resetPassword('NewPassword123', 'otp-token');

      expect(insforgeClient.auth.resetPassword).toHaveBeenCalledWith({
        newPassword: 'NewPassword123',
        otp: 'otp-token',
      });
    });

    it('should throw when the SDK returns an error', async () => {
      vi.mocked(insforgeClient.auth.resetPassword).mockResolvedValue({
        data: null,
        error: { message: 'invalid token' },
      } as any);

      await expect(repo.resetPassword('NewPassword123', 'bad-token')).rejects.toThrow(
        'invalid token',
      );
    });

    it('should throw a generic message when error has no message', async () => {
      vi.mocked(insforgeClient.auth.resetPassword).mockResolvedValue({
        data: null,
        error: {},
      } as any);

      await expect(repo.resetPassword('NewPassword123', 'bad-token')).rejects.toThrow(
        'Failed to reset password',
      );
    });
  });
});