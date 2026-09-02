import { EmailService } from '../../core/use-cases/EmailService';
import { insforgeClient } from '../insforge/client';

export class InsForgeEmailService implements EmailService {
  async sendResetEmail(email: string, token: string): Promise<void> {
    // Construimos la URL de recuperación.
    // En producción viene de una variable de entorno (ej: VITE_APP_URL)
    const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    const htmlBody = `
      <p>Hola,</p>
      <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
      <p>Haz clic en el siguiente enlace para cambiarla:</p>
      <p><a href="${resetLink}">Restablecer contraseña</a></p>
      <p>Este enlace expirará en 1 hora. Si no has solicitado este cambio, puedes ignorar este mensaje.</p>
    `;

    try {
      // API real del SDK: client.emails.send({ to, subject, html })
      await insforgeClient.emails.send({
        to: email,
        subject: 'Recuperación de Contraseña - Experimental BKOFFC',
        html: htmlBody,
      });
      console.log(`Reset email sent successfully to ${email}`);
    } catch (error) {
      console.error('Error sending reset email via InsForge:', error);
      throw new Error('Failed to send recovery email');
    }
  }
}