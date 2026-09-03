import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { Request, Response } from 'express';
import { PasswordResetController } from '../../../src/infrastructure/controllers/PasswordResetController';

describe('PasswordResetController', () => {
  let authResetRepository: any;
  let controller: PasswordResetController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeAll(() => {
    process.env.VITE_APP_URL = 'https://app.example.com';
  });

  afterAll(() => {
    delete process.env.VITE_APP_URL;
  });

  beforeEach(() => {
    authResetRepository = {
      sendResetPasswordEmail: vi.fn(),
      resetPassword: vi.fn(),
    };

    controller = new PasswordResetController(authResetRepository);

    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('requestReset', () => {
    it('should delegate with redirectTo when provided', async () => {
      req.body = { email: 'test@example.com', redirectTo: 'https://miapp.es/reset' };
      vi.mocked(authResetRepository.sendResetPasswordEmail).mockResolvedValue(undefined);

      await controller.requestReset(req as Request, res as Response);

      expect(authResetRepository.sendResetPasswordEmail).toHaveBeenCalledWith(
        'test@example.com',
        'https://miapp.es/reset',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'If the email exists, a recovery link was sent',
      });
    });

    it('should default redirectTo to VITE_APP_URL/reset-password when not provided', async () => {
      req.body = { email: 'test@example.com' };
      vi.mocked(authResetRepository.sendResetPasswordEmail).mockResolvedValue(undefined);

      await controller.requestReset(req as Request, res as Response);

      expect(authResetRepository.sendResetPasswordEmail).toHaveBeenCalledWith(
        'test@example.com',
        'https://app.example.com/reset-password',
      );
    });

    it('should fall back to localhost:5173 when VITE_APP_URL is not set', async () => {
      process.env.VITE_APP_URL = '';
      req.body = { email: 'test@example.com' };
      vi.mocked(authResetRepository.sendResetPasswordEmail).mockResolvedValue(undefined);

      await controller.requestReset(req as Request, res as Response);

      expect(authResetRepository.sendResetPasswordEmail).toHaveBeenCalledWith(
        'test@example.com',
        'http://localhost:5173/reset-password',
      );
    });

    it('should return 400 when email is missing', async () => {
      await controller.requestReset(req as Request, res as Response);

      expect(authResetRepository.sendResetPasswordEmail).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' });
    });

    it('should return a generic success message even if the email does not exist', async () => {
      req.body = { email: 'unknown@example.com' };
      vi.mocked(authResetRepository.sendResetPasswordEmail).mockResolvedValue(undefined);

      await controller.requestReset(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'If the email exists, a recovery link was sent',
      });
    });

    it('should return 400 on delegate failure', async () => {
      req.body = { email: 'test@example.com' };
      vi.mocked(authResetRepository.sendResetPasswordEmail).mockRejectedValue(
        new Error('Failed to request reset'),
      );

      await controller.requestReset(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to request reset' });
    });
  });

  describe('resetPassword', () => {
    it('should delegate with otp (token) and password, returning 200', async () => {
      req.body = { token: 'otp-token', password: 'NewPassword123' };
      vi.mocked(authResetRepository.resetPassword).mockResolvedValue(undefined);

      await controller.reset(req as Request, res as Response);

      expect(authResetRepository.resetPassword).toHaveBeenCalledWith(
        'NewPassword123',
        'otp-token',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Password updated successfully' });
    });

    it('should return 400 when token or password is missing', async () => {
      req.body = { token: 'otp-token' };

      await controller.reset(req as Request, res as Response);

      expect(authResetRepository.resetPassword).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token and password are required' });
    });

    it('should return 400 when reset fails', async () => {
      req.body = { token: 'bad-token', password: 'NewPassword123' };
      vi.mocked(authResetRepository.resetPassword).mockRejectedValue(
        new Error('Invalid or expired token'),
      );

      await controller.reset(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });
  });
});