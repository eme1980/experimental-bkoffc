import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { AuthController } from '../../../src/infrastructure/controllers/AuthController';

describe('AuthController', () => {
  let authRepository: any;
  let controller: AuthController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    authRepository = {
      login: vi.fn(),
      register: vi.fn(),
    };

    controller = new AuthController(authRepository);

    req = { body: {} };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('login', () => {
    it('should call authRepository.login and return 200 with the auth result on success', async () => {
      req.body = { email: 'test@example.com', password: 'Password123!' };
      vi.mocked(authRepository.login).mockResolvedValue({
        token: 'session-token',
        user: { id: 'user-1', email: 'test@example.com' },
      });

      await controller.login(req as Request, res as Response);

      expect(authRepository.login).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'session-token',
        user: { id: 'user-1', email: 'test@example.com' },
      });
    });

    it('should return 400 when email or password is missing', async () => {
      req.body = { email: 'test@example.com' };

      await controller.login(req as Request, res as Response);

      expect(authRepository.login).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    });

    it('should return 401 when login fails', async () => {
      req.body = { email: 'test@example.com', password: 'wrongpassword' };
      vi.mocked(authRepository.login).mockRejectedValue(new Error('Invalid credentials'));

      await controller.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });
  });

  describe('register', () => {
    it('should call authRepository.register and return 201 with the auth result on success', async () => {
      req.body = { email: 'test@example.com', password: 'Password123!' };
      vi.mocked(authRepository.register).mockResolvedValue({
        token: 'session-token',
        user: { id: 'user-1', email: 'test@example.com' },
      });

      await controller.register(req as Request, res as Response);

      expect(authRepository.register).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        token: 'session-token',
        user: { id: 'user-1', email: 'test@example.com' },
      });
    });

    it('should return 400 when email or password is missing', async () => {
      req.body = { password: 'Password123!' };

      await controller.register(req as Request, res as Response);

      expect(authRepository.register).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    });

    it('should return 400 when registration fails', async () => {
      req.body = { email: 'test@example.com', password: 'Password123!' };
      vi.mocked(authRepository.register).mockRejectedValue(new Error('Registration failed'));

      await controller.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Registration failed' });
    });
  });
});