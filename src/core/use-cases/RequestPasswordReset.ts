import { AuthResetRepository } from './AuthResetRepository';

export class RequestPasswordReset {
  constructor(private authResetRepository: AuthResetRepository) {}

  async execute(email: string, redirectTo?: string): Promise<void> {
    await this.authResetRepository.sendResetPasswordEmail(email, redirectTo);
  }
}