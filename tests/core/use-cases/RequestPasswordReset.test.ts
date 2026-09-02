import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestPasswordReset } from '../../../src/core/use-cases/RequestPasswordReset';

// Mock del módulo crypto para verificar que se usa randomBytes
vi.mock('crypto', () => ({
  randomBytes: vi.fn(),
}));
import { randomBytes } from 'crypto';

// sha256 en hex de los tokens "en claro" que genera el mock
const SHA256_OF = {
  a1b2c3d4e5f6a1b2c3d4e5f6:
    '8a9b5504ba601abae81e75d92b611d1d3990c5e4cd1a09b763a2f5801107faf6',
  aa: '961b6dd3ede3cb8ecbaacbd68de040cd78eb2ed5889130cceb4c49268ea4d506',
  bb: '3b64db95cb55c763391c707108489ae18b4112d783300de38e033b4c98c3deaf',
};

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

  it('should persist only the sha256 hash of the token and send the raw token by email', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);
    const rawToken = 'a1b2c3d4e5f6a1b2c3d4e5f6';
    vi.mocked(randomBytes).mockReturnValue(Buffer.from(rawToken, 'hex'));

    await requestPasswordReset.execute('test@example.com');

    // En BD se guarda SOLO el hash (nunca el token en claro).
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '123',
        resetToken: SHA256_OF[rawToken],
        resetTokenExpires: expect.any(Date),
      })
    );
    // En el email va el token en claro (el eslabón que recibe el usuario).
    expect(emailService.sendResetEmail).toHaveBeenCalledWith('test@example.com', rawToken);
  });

  it('should generate a different hash each call', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);
    vi.mocked(randomBytes)
      .mockReturnValueOnce(Buffer.from('aa', 'hex'))
      .mockReturnValueOnce(Buffer.from('bb', 'hex'));

    await requestPasswordReset.execute('test@example.com');
    await requestPasswordReset.execute('test@example.com');

    const calls = vi.mocked(userRepository.save).mock.calls;
    expect(calls[0][0].resetToken).toBe(SHA256_OF.aa);
    expect(calls[1][0].resetToken).toBe(SHA256_OF.bb);
    expect(calls[0][0].resetToken).not.toBe(calls[1][0].resetToken);
    // El hash almacenado nunca debe coincidir con el token en claro.
    expect(calls[0][0].resetToken).not.toBe('aa');
    expect(calls[1][0].resetToken).not.toBe('bb');
  });

  it('should throw an error when the user does not exist', async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(requestPasswordReset.execute('unknown@example.com'))
      .rejects.toThrow('User not found');
  });
});