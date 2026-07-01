import { Request, Response } from 'express';
import { LoginUser } from '../../core/use-cases/LoginUser';
import { RegisterUser } from '../../core/use-cases/RegisterUser';

export class AuthController {
  constructor(
    private loginUserUseCase: LoginUser,
    private registerUserUseCase: RegisterUser
  ) {}

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await this.loginUserUseCase.execute(email, password);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
      }
      const result = await this.registerUserUseCase.execute({ name, email, password });
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
