export interface EmailService {
  sendResetEmail(email: string, token: string): Promise<void>;
}
