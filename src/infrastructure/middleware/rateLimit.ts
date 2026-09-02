import rateLimit from 'express-rate-limit';

const MINUTE = 60 * 1000;

// Anti fuerza bruta en /auth/login: máximo 5 intentos por IP cada 15 minutos.
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * MINUTE;

// Anti spam de emails en /auth/reset-password-request: máximo 3 solicitudes por IP cada hora.
export const RESET_REQUEST_MAX = 3;
export const RESET_WINDOW_MS = 60 * MINUTE;

export const loginRateLimiter = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: LOGIN_MAX_ATTEMPTS,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' },
});

export const resetPasswordRequestRateLimiter = rateLimit({
  windowMs: RESET_WINDOW_MS,
  limit: RESET_REQUEST_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Try again later.' },
});