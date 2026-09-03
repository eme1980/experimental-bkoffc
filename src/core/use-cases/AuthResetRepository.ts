export interface AuthResetRepository {
  /** Pide a InsForge que envíe el email de recuperación de contraseña. */
  sendResetPasswordEmail(email: string, redirectTo?: string): Promise<void>;
  /** Cambia la contraseña del usuario con el token/otp del email. */
  resetPassword(newPassword: string, otp: string): Promise<void>;
}