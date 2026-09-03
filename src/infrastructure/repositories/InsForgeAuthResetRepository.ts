import { AuthResetRepository } from '../../core/use-cases/AuthResetRepository';
import { insforgeClient } from '../insforge/client';

export class InsForgeAuthResetRepository implements AuthResetRepository {
  async sendResetPasswordEmail(email: string, redirectTo?: string): Promise<void> {
    const { error } = await insforgeClient.auth.sendResetPasswordEmail({
      email,
      redirectTo,
    });

    if (error) {
      throw new Error(error.message || 'Failed to request password reset');
    }
  }

  async resetPassword(newPassword: string, otp: string): Promise<void> {
    const { error } = await insforgeClient.auth.resetPassword({
      newPassword,
      otp,
    });

    if (error) {
      throw new Error(error.message || 'Failed to reset password');
    }
  }
}