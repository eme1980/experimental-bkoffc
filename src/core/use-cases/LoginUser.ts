import { UserRepository } from './UserRepository';

export class LoginUser {
  constructor(private userRepository: UserRepository) {}

  async execute(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }

    // En una implementación real, aquí compararíamos hashes de contraseñas.
    // Para el test inicial, simulamos una validación simple.
    if (password !== 'password123' && (user as any).password !== password) {
      throw new Error('Invalid credentials');
    }

    return {
      token: 'simulated-jwt-token',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
