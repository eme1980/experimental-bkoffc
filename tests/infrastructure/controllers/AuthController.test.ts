import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { AuthController } from '../../../src/infrastructure/controllers/AuthController';

describe('AuthController', () => {
  let loginUserUseCase: any;
  let registerUserUseCase: any;
  let controller: AuthController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    loginUserUseCase = { execute: vi.fn() };
    registerUserUseCase = { execute: vi.fn() };

    controller = new AuthController(loginUserUseCase, registerUserUseCase);

    req = { body: {} };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('login', () => {
    it('should return 200 with the auth result on success', async () => {
      req.body = { email: 'test@example.com', password: 'Password123!' };
      vi.mocked(loginUserUseCase.execute).mockResolvedValue({
        token: 'session-token',
        user: { id: 'user-1', email: 'test@example.com' },
      });

      await controller.login(req as Request, res as Response);

      expect(loginUserUseCase.execute).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'session-token',
        user: { id: 'user-1', email: 'test@example.com' },
      });
    });

    it('should return 400 when email or password is missing', async () => {
      req.body = { email: 'test@example.com' };

      await controller.login(req as Request, res as Response);

      expect(loginUserUseCase.execute).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    });

    it('should return 401 when login fails', async () => {
      req.body = { email: 'test@example.com', password: 'wrongpassword' };
      vi.mocked(loginUserUseCase.execute).mockRejectedValue(new Error('Invalid credentials'));

      await controller.login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });
  });

  describe('register', () => {
    it('should return 201 with the auth result on success', async () => {
      req.body = { email: 'test@example.com', password: 'Password123!' };
      vi.mocked(registerUserUseCase.execute).mockResolvedValue({
        token: 'session-token',
        user: { id: 'user-1', email: 'test@example.com' },
      });

      await controller.register(req as Request, res as Response);

      expect(registerUserUseCase.execute).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        token: 'session-token',
        user: { id: 'user-1', email: 'test@example.com' },
      });
    });

    it('should return 400 when email or password is missing', async () => {
      req.body = { password: 'Password123!' };

      await controller.register(req as Request, res as Response);

      expect(registerUserUseCase.execute).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    });

    it('should return 400 when registration fails', async () => {
      req.body = { email: 'test@example.com', password: 'Password123!' };
      vi.mocked(registerUserUseCase.execute).mockRejectedValue(new Error('Registration failed'));

      await controller.register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Registration failed' });
    });
  });
});