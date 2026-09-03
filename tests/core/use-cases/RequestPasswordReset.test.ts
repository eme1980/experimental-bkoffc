import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestPasswordReset } from '../../../src/core/use-cases/RequestPasswordReset';

describe('RequestPasswordReset Use Case', () => {
  let authResetRepository: any;
  let requestPasswordReset: RequestPasswordReset;

  beforeEach(() => {
    authResetRepository = {
      sendResetPasswordEmail: vi.fn(),
      resetPassword: vi.fn(),
    };
    requestPasswordReset = new RequestPasswordReset(authResetRepository);
  });

  it('should delegate to authResetRepository.sendResetPasswordEmail with email and redirectTo', async () => {
    await requestPasswordReset.execute(
      'test@example.com',
      'https://app.example.com/reset-password',
    );

    expect(authResetRepository.sendResetPasswordEmail).toHaveBeenCalledWith(
      'test@example.com',
      'https://app.example.com/reset-password',
    );
  });

  it('should call sendResetPasswordEmail without redirectTo when not provided', async () => {
    await requestPasswordReset.execute('test@example.com');

    expect(authResetRepository.sendResetPasswordEmail).toHaveBeenCalledWith(
      'test@example.com',
      undefined,
    );
  });
});