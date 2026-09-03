import cors, { CorsOptions, CorsRequest } from 'cors';
import type { Response } from 'express';

/**
 * Middleware CORS configurable para el servicio multi-app.
 *
 * Una API consumida por varias webs/apps debe permitir explícitamente los
 * orígenes que la usan. Se configura la lista de orígenes permitidos vía la
 * variable de entorno `CORS_ORIGINS` (lista separada por comas), p. ej.:
 *
 *   CORS_ORIGINS=https://app1.example.com,https://admin.example.com
 *
 * Reglas:
 * - Origen en la lista permitida → se refleja en `Access-Control-Allow-Origin`
 *   y se habilitan credenciales (`Access-Control-Allow-Credentials: true`).
 * - Origen NO en la lista → no se emite cabecera CORS (el navegador lo bloquea).
 * - Lista vacía / no configurada → se deniega TODO origen cross-origin (seguro
 *   por defecto). No usamos `*`: los endpoints con credenciales/token no deben
 *   permitir CORS abierto.
 */
export const ALLOWED_ORIGINS_ENV_KEY = 'CORS_ORIGINS';

export function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createCorsMiddleware(
  allowedOrigins: string[],
): (req: CorsRequest, res: Response, next: () => void) => void {
  const options: CorsOptions = {
    origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      if (!origin) {
        // Sin cabecera Origin (curl, server-to-server, mismo origen): permitido.
        callback(null, true);
        return;
      }
      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  };
  return cors(options);
}

// Instancia por defecto leída de la variable de entorno en el arranque.
const configuredOrigins: string[] = parseAllowedOrigins(process.env[ALLOWED_ORIGINS_ENV_KEY]);
export const ALLOWED_ORIGINS: string[] = configuredOrigins;
export const corsMiddleware = createCorsMiddleware(configuredOrigins);