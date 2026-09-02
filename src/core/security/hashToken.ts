import { createHash } from 'crypto';

/**
 * Huella SHA-256 (hex) de un token de reset en claro.
 * En BD solo se persiste el hash; el token en claro únicamente viaja en el email.
 */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}