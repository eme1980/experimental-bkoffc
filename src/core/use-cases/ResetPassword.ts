import { UserRepository } from './UserRepository';
import { User } from '../entities/User';
import { hashToken } from '../security/hashToken';

export class ResetPassword {
  constructor(private userRepository: UserRepository) {}

  async execute(token: string, newPassword: string): Promise<void> {
    // En BD solo existe el hash: comparamos la huella del token recibido.
    const user = await this.userRepository.findByResetToken(hashToken(token));

    if (!user) {
      throw new Error('Invalid or expired token');
    }

    const now = new Date();
    if (user.resetTokenExpires && user.resetTokenExpires < now) {
      throw new Error('Invalid or expired token');
    }

    // Reutilizamos la validación de la entidad User (longitud mínima de 8 chars).
    const validated = new User(user.email, newPassword);

    // Actualizamos la contraseña y eliminamos el token para que no sea reutilizable
    await this.userRepository.save({
      ...user,
      password: validated.password,
      resetToken: null,
      resetTokenExpires: null,
    });
  }
}