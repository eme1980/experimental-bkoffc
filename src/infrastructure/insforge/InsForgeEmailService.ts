import { EmailService } from '../../core/use-cases/EmailService';
import { insforgeClient } from '../insforge/client';

export class InsForgeEmailService implements EmailService {
  async sendResetEmail(email: string, token: string): Promise<void> {
    // Construimos la URL de recuperación. 
    // En producción, esto debería venir de una variable de entorno (ej: VITE_APP_URL)
    const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    const emailBody = `
      Hola,

      Hemos recibido una solicitud para restablecer tu contraseña.
      Haz clic en el siguiente enlace para cambiarla:
      ${resetLink}

      Este enlace expirará en 1 hora. Si no has solicitado este cambio, puedes ignorar este mensaje.
    `;

    try {
      await insforgeClient.email.send({
        to: email,
        subject: 'Recuperación de Contraseña - Experimental BKOFFC',
        text: emailBody,
      });
      console.log(`Reset email sent successfully to ${email}`);
    } catch (error) {
      console.error('Error sending reset email via InsForge:', error);
      throw new Error('Failed to send recovery email');
    }
  }
}
