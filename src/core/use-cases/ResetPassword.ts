import { AuthResetRepository } from './AuthResetRepository';

export class ResetPassword {
  constructor(private authResetRepository: AuthResetRepository) {}

  async execute(otp: string, newPassword: string): Promise<void> {
    await this.authResetRepository.resetPassword(newPassword, otp);
  }
}