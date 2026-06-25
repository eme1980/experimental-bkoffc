import { User } from '../entities/User';
import { UserRepository } from './UserRepository';

export class RegisterUser {
  constructor(private userRepository: UserRepository) {}

  async execute(email: string, password: string): Promise<User> {
    // Validamos la entidad (esto ya lanza errores si el email/password son inválidos)
    const user = new User(email, password);

    // Verificamos si ya existe
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Guardamos
    return await this.userRepository.save(user);
  }
}
