import express from 'express';
import { InsForgeAuthRepository } from './infrastructure/repositories/InsForgeAuthRepository';
import { LoginUser } from './core/use-cases/LoginUser';
import { RegisterUser } from './core/use-cases/RegisterUser';
import { AuthController } from './infrastructure/controllers/AuthController';

const app = express();
app.use(express.json());

// Composition Root: Inyección de Dependencias
const authRepository = new InsForgeAuthRepository();
const loginUserUseCase = new LoginUser(authRepository);
const registerUserUseCase = new RegisterUser(authRepository);
const authController = new AuthController(loginUserUseCase, registerUserUseCase);

// Rutas
app.get('/', (req, res) => {
  res.json({ name: 'Experimental Backoffice API', version: '1.0.0', status: 'ok' });
});

app.post('/auth/login', (req, res) => authController.login(req, res));
app.post('/auth/register', (req, res) => authController.register(req, res));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  POST /auth/register`);
  console.log(`  POST /auth/login`);
});