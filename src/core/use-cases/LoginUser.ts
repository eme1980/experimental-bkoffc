import { AuthRepository } from './AuthRepository';

export class LoginUser {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string, password: string) {
    return await this.authRepository.login(email, password);
  }
}