import express from 'express';
import { InsForgeAuthRepository } from './infrastructure/repositories/InsForgeAuthRepository';
import { InsForgeAuthResetRepository } from './infrastructure/repositories/InsForgeAuthResetRepository';
import { LoginUser } from './core/use-cases/LoginUser';
import { RegisterUser } from './core/use-cases/RegisterUser';
import { RequestPasswordReset } from './core/use-cases/RequestPasswordReset';
import { ResetPassword } from './core/use-cases/ResetPassword';
import { AuthController } from './infrastructure/controllers/AuthController';
import { PasswordResetController } from './infrastructure/controllers/PasswordResetController';
import { logger } from './infrastructure/logger/Logger';
import { createRequestLogger } from './infrastructure/logger/requestLogger';
import {
  loginRateLimiter,
  resetPasswordRequestRateLimiter,
} from './infrastructure/middleware/rateLimit';

const app = express();
app.use(express.json());
// Logging estructurado de peticiones (requestId + método + status + duración).
app.use(createRequestLogger(logger));
// Detrás del proxy inverso de Dokploy las peticiones llegan con X-Forwarded-For:
// sin confiar en proxy, express-rate-limit usaría la IP del proxy para todos y
// bloquearía a todos los clientes por igual (o lanzaría ERR_ERL_PERMISSIVE_TRUST_PROXY).
app.set('trust proxy', 1);

// Composition Root: Inyección de Dependencias
const authRepository = new InsForgeAuthRepository();
const authResetRepository = new InsForgeAuthResetRepository();

const loginUserUseCase = new LoginUser(authRepository);
const registerUserUseCase = new RegisterUser(authRepository);
const requestPasswordResetUseCase = new RequestPasswordReset(authResetRepository);
const resetPasswordUseCase = new ResetPassword(authResetRepository);

const authController = new AuthController(loginUserUseCase, registerUserUseCase);
const passwordResetController = new PasswordResetController(requestPasswordResetUseCase, resetPasswordUseCase);

// Rutas
app.get('/', (req, res) => {
  res.json({ name: 'Experimental Backoffice API', version: '1.0.0', status: 'ok' });
});

app.post('/auth/login', loginRateLimiter, (req, res) => authController.login(req, res));
app.post('/auth/register', (req, res) => authController.register(req, res));
app.post('/auth/reset-password-request', resetPasswordRequestRateLimiter, (req, res) => passwordResetController.requestReset(req, res));
app.post('/auth/reset-password', (req, res) => passwordResetController.reset(req, res));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info('Server running', { url: `http://localhost:${PORT}` });
  logger.info('Endpoints registrados', {
    routes: [
      'POST /auth/register',
      'POST /auth/login',
      'POST /auth/reset-password-request',
      'POST /auth/reset-password',
    ],
  });
});
