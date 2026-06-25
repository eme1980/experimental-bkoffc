import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestPasswordReset } from '/opt/data/experimental-bkoffc/src/core/use-cases/RequestPasswordReset';

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

    await requestPasswordReset.execute('test@example.com');

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

  it('should throw an error when the user does not exist', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(requestPasswordReset.execute('unknown@example.com'))
      .rejects.toThrow('User not found');
  });
});
