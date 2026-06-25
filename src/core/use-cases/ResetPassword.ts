import { UserRepository } from './UserRepository';

export class ResetPassword {
  constructor(private userRepository: UserRepository) {}

  async execute(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findByResetToken(token);

    if (!user) {
      throw new Error('Invalid or expired token');
    }

    const now = new Date();
    if (user.resetTokenExpires && user.resetTokenExpires < now) {
      throw new Error('Invalid or expired token');
    }

    // Actualizamos la contraseña y eliminamos el token para que no sea reutilizable
    await this.userRepository.save({
      ...user,
      password: newPassword,
      resetToken: null,
      resetTokenExpires: null,
    });
  }
}
