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
      const { email, redirectTo } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // InsForge envía el email de recuperación y gestiona el enlace/otp. El
      // redirectTo lleva al frontend que recogerá el token del enlace. Si no se
      // pasa uno en el request, se deriva de APP_URL (VITE_APP_URL).
      const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
      const target = redirectTo || `${appUrl}/reset-password`;

      await this.requestPasswordReset.execute(email, target);
      // Respuesta genérica: InsForge previene la enumeración de usuarios, así
      // que siempre devolvemos el mismo mensaje aunque el email no exista.
      return res.status(200).json({ message: 'If the email exists, a recovery link was sent' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
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