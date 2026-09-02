import { Request, Response } from 'express';
import { RequestPasswordReset } from '../../core/use-cases/RequestPasswordReset';
import { ResetPassword } from '../../core/use-cases/ResetPassword';

export class PasswordResetController {
  constructor(
    private requestPasswordReset: RequestPasswordReset,
    private resetPassword: ResetPassword
  ) {}

  async requestReset(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      await this.requestPasswordReset.execute(email);
      return res.status(200).json({ message: 'If the email exists, a recovery link was sent' });
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  async reset(req: Request, res: Response) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
      }

      await this.resetPassword.execute(token, password);
      return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}