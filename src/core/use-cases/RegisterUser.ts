import { AuthRepository } from './AuthRepository';

export class RegisterUser {
  constructor(private authRepository: AuthRepository) {}

  async execute(email: string, password: string) {
    return await this.authRepository.register(email, password);
  }
}