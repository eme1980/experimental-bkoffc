import { UserRepository } from './UserRepository';
import { EmailService } from './EmailService';
import { randomBytes } from 'crypto';
import { hashToken } from '../security/hashToken';

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

    // Generamos un token aleatorio seguro (criptográficamente) y su huella sha256.
    const token = randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Expira en 1 hora

    // Persistimos SOLO el hash en la base de datos (nunca el token en claro).
    await this.userRepository.save({
      ...user,
      resetToken: tokenHash,
      resetTokenExpires: expiresAt,
    });

    // El email recibe el token en claro (el eslabón que llega al usuario).
    await this.emailService.sendResetEmail(email, token);
  }
}