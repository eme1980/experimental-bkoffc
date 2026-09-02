import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { PasswordResetController } from '../../../src/infrastructure/controllers/PasswordResetController';

describe('PasswordResetController', () => {
  let requestPasswordReset: any;
  let resetPassword: any;
  let controller: PasswordResetController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    requestPasswordReset = { execute: vi.fn() };
    resetPassword = { execute: vi.fn() };

    controller = new PasswordResetController(requestPasswordReset, resetPassword);

    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('requestReset', () => {
    it('should return 200 when request succeeds', async () => {
      req.body = { email: 'test@example.com' };
      vi.mocked(requestPasswordReset.execute).mockResolvedValue(undefined);

      await controller.requestReset(req as Request, res as Response);

      expect(requestPasswordReset.execute).toHaveBeenCalledWith('test@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'If the email exists, a recovery link was sent' });
    });

    it('should return 400 when email is missing', async () => {
      await controller.requestReset(req as Request, res as Response);

      expect(requestPasswordReset.execute).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' });
    });

    it('should return 404 when the user does not exist', async () => {
      req.body = { email: 'unknown@example.com' };
      vi.mocked(requestPasswordReset.execute).mockRejectedValue(new Error('User not found'));

      await controller.requestReset(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 500 on send failure', async () => {
      req.body = { email: 'test@example.com' };
      vi.mocked(requestPasswordReset.execute).mockRejectedValue(new Error('Failed to send recovery email'));

      await controller.requestReset(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to send recovery email' });
    });
  });

  describe('resetPassword', () => {
    it('should return 200 when password is reset', async () => {
      req.body = { token: 'valid-token', password: 'NewPassword123' };
      vi.mocked(resetPassword.execute).mockResolvedValue(undefined);

      await controller.reset(req as Request, res as Response);

      expect(resetPassword.execute).toHaveBeenCalledWith('valid-token', 'NewPassword123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Password updated successfully' });
    });

    it('should return 400 when token or password is missing', async () => {
      req.body = { token: 'valid-token' };

      await controller.reset(req as Request, res as Response);

      expect(resetPassword.execute).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token and password are required' });
    });

    it('should return 400 when token is invalid or expired', async () => {
      req.body = { token: 'bad-token', password: 'NewPassword123' };
      vi.mocked(resetPassword.execute).mockRejectedValue(new Error('Invalid or expired token'));

      await controller.reset(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    });
  });
});