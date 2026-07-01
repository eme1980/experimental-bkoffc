import express from 'express';
import { InsForgeUserRepository } from './infrastructure/repositories/InsForgeUserRepository';
import { LoginUser } from './core/use-cases/LoginUser';
import { RegisterUser } from './core/use-cases/RegisterUser';
import { AuthController } from './infrastructure/controllers/AuthController';

const app = express();
app.use(express.json());

// Composition Root: Inyección de Dependencias
const userRepository = new InsForgeUserRepository();
const loginUserUseCase = new LoginUser(userRepository);
const registerUserUseCase = new RegisterUser(userRepository);
const authController = new AuthController(loginUserUseCase, registerUserUseCase);

// Rutas
app.post('/auth/login', (req, res) => authController.login(req, res));
app.post('/auth/register', (req, res) => authController.register(req, res));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  POST /auth/register`);
  console.log(`  POST /auth/login`);
});
