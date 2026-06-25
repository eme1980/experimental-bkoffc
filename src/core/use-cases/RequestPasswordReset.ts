import { UserRepository } from './UserRepository';
import { EmailService } from './EmailService';
import { crypto } from 'crypto';

export class RequestPasswordReset {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }

    // Generamos un token aleatorio seguro
    const token = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira en 1 hora

    // Persistimos el token en la base de datos
    await this.userRepository.save({
      ...user,
      resetToken: token,
      resetTokenExpires: expiresAt,
    });

    // Enviamos el email con el token
    await this.emailService.sendResetEmail(email, token);
  }
}
