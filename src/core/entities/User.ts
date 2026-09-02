export class User {
  public readonly email: string;
  public readonly password: string;

  constructor(email: string, password: string) {
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }
    if (password.length < 8) {
      throw new Error('Password too short');
    }
    this.email = email;
    this.password = password;
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Registro de dominio de un usuario persistido, tal y como lo maneja el flujo
 * de recuperación de contraseña (id, email + token de reset).
 * El Core lo define y la infraestructura lo implementa/mapea.
 */
export type ResetUser = {
  id?: string;
  email: string;
  /** Contraseña, presente cuando el flujo de reset la actualiza. */
  password?: string;
  resetToken?: string | null;
  resetTokenExpires?: Date | null;
};
