import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InsForgeEmailService } from '../../../src/infrastructure/insforge/InsForgeEmailService';
import { insforgeClient } from '../../../src/infrastructure/insforge/client';

vi.mock('../../../src/infrastructure/insforge/client', () => ({
  insforgeClient: {
    emails: {
      send: vi.fn(),
    },
  },
}));

describe('InsForgeEmailService', () => {
  let service: InsForgeEmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InsForgeEmailService();
  });

  it('should call emails.send with the recovery link and html body', async () => {
    vi.mocked(insforgeClient.emails.send).mockResolvedValue({
      data: {},
      error: null,
    } as any);

    await service.sendResetEmail('user@example.com', 'tok-123');

    expect(insforgeClient.emails.send).toHaveBeenCalledTimes(1);
    const args = vi.mocked(insforgeClient.emails.send).mock.calls[0][0];
    expect(args).toMatchObject({
      to: 'user@example.com',
      subject: 'Recuperación de Contraseña - Experimental BKOFFC',
    });
    expect(args.html).toContain('tok-123');
    expect(args.html).toContain('http://localhost:5173/reset-password?token=tok-123');
  });

  it('should use VITE_APP_URL for the reset link when set', async () => {
    const prev = process.env.VITE_APP_URL;
    process.env.VITE_APP_URL = 'https://app.contrateme.es';
    vi.mocked(insforgeClient.emails.send).mockResolvedValue({
      data: {},
      error: null,
    } as any);

    await service.sendResetEmail('a@b.com', 'tok-9');

    const args = vi.mocked(insforgeClient.emails.send).mock.calls[0][0];
    expect(args.html).toContain('https://app.contrateme.es/reset-password?token=tok-9');

    process.env.VITE_APP_URL = prev;
  });

  it('should throw "Failed to send recovery email" when emails.send rejects', async () => {
    vi.mocked(insforgeClient.emails.send).mockRejectedValue(new Error('smtp down'));

    await expect(service.sendResetEmail('user@example.com', 'tok-1')).rejects.toThrow(
      'Failed to send recovery email',
    );
  });
});