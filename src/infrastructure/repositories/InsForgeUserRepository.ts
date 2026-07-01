import { UserRepository } from '../../core/use-cases/UserRepository';
import { User } from '../../core/entities/User';
import { insforgeClient } from '../insforge/client';

export class InsForgeUserRepository implements UserRepository {
  async save(user: User): Promise<void> {
    try {
      await insforgeClient.db.insert('users', {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving user to InsForge:', error);
      throw new Error('Could not save user to database');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const results = await insforgeClient.db.select('users', {
        where: { email },
      });
      
      if (results.length === 0) return null;
      
      const data = results[0];
      return new User(data.id, data.email, data.name);
    } catch (error) {
      console.error('Error finding user in InsForge:', error);
      throw new Error('Could not fetch user from database');
    }
  }

  async findByResetToken(token: string): Promise<User | null> {
    try {
      const results = await insforgeClient.db.select('users', {
        where: { resetToken: token },
      });
      
      if (results.length === 0) return null;
      
      const data = results[0];
      return new User(data.id, data.email, data.name);
    } catch (error) {
      console.error('Error finding user by reset token in InsForge:', error);
      throw new Error('Could not fetch user from database');
    }
  }

}
