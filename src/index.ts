import express from 'express';
import { InsForgeAuthRepository } from './infrastructure/repositories/InsForgeAuthRepository';
import { InsForgeUserRepository } from './infrastructure/repositories/InsForgeUserRepository';
import { InsForgeEmailService } from './infrastructure/insforge/InsForgeEmailService';
import { LoginUser } from './core/use-cases/LoginUser';
import { RegisterUser } from './core/use-cases/RegisterUser';
import { RequestPasswordReset } from './core/use-cases/RequestPasswordReset';
import { ResetPassword } from './core/use-cases/ResetPassword';
import { AuthController } from './infrastructure/controllers/AuthController';
import { PasswordResetController } from './infrastructure/controllers/PasswordResetController';

const app = express();
app.use(express.json());

// Composition Root: Inyección de Dependencias
const authRepository = new InsForgeAuthRepository();
const userRepository = new InsForgeUserRepository();
const emailService = new InsForgeEmailService();

const loginUserUseCase = new LoginUser(authRepository);
const registerUserUseCase = new RegisterUser(authRepository);
const requestPasswordResetUseCase = new RequestPasswordReset(userRepository, emailService);
const resetPasswordUseCase = new ResetPassword(userRepository);

const authController = new AuthController(loginUserUseCase, registerUserUseCase);
const passwordResetController = new PasswordResetController(requestPasswordResetUseCase, resetPasswordUseCase);

// Rutas
app.get('/', (req, res) => {
  res.json({ name: 'Experimental Backoffice API', version: '1.0.0', status: 'ok' });
});

app.post('/auth/login', (req, res) => authController.login(req, res));
app.post('/auth/register', (req, res) => authController.register(req, res));
app.post('/auth/reset-password-request', (req, res) => passwordResetController.requestReset(req, res));
app.post('/auth/reset-password', (req, res) => passwordResetController.reset(req, res));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  POST /auth/register`);
  console.log(`  POST /auth/login`);
  console.log(`  POST /auth/reset-password-request`);
  console.log(`  POST /auth/reset-password`);
});