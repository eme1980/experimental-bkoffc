import { UserRepository } from '../../core/use-cases/UserRepository';
import { ResetUser } from '../../core/entities/User';
import { insforgeClient } from '../insforge/client';
import { logger } from '../logger/Logger';

export class InsForgeUserRepository implements UserRepository {
  async save(user: ResetUser): Promise<void> {
    try {
      // API real del SDK: client.database.from(table).insert(payload).select()
      // o client.database.from(table).update(payload).eq("id", id).select()
      const payload = {
        id: user.id,
        email: user.email,
        reset_token: user.resetToken ?? null,
        reset_token_expires_at: user.resetTokenExpires?.toISOString() ?? null,
      };

      if (user.id) {
        // El usuario ya existe (flujo de reset): actualizamos la fila existente.
        await insforgeClient.database.from('users').update(payload).eq('id', user.id).select();
      } else {
        await insforgeClient.database.from('users').insert(payload).select();
      }
    } catch (error) {
      logger.error('Error guardando el usuario en InsForge', error);
      throw new Error('Could not save user to database');
    }
  }

  async findByEmail(email: string): Promise<ResetUser | null> {
    return this.findBy({ email });
  }

  async findByResetToken(token: string): Promise<ResetUser | null> {
    return this.findBy({ reset_token: token });
  }

  private async findBy(filter: Record<string, string>): Promise<ResetUser | null> {
    try {
      let query = insforgeClient.database.from('users').select() as any;
      for (const [column, value] of Object.entries(filter)) {
        query = query.eq(column, value);
      }
      const { data, error } = await query.maybeSingle();

      if (error) {
        logger.error('Error consultando el usuario en InsForge', error);
        throw new Error('Could not fetch user from database');
      }
      if (!data) return null;

      return {
        id: data.id,
        email: data.email,
        resetToken: data.reset_token ?? null,
        resetTokenExpires: data.reset_token_expires_at ? new Date(data.reset_token_expires_at) : null,
      };
    } catch (error) {
      logger.error('Error buscando el usuario en InsForge', error);
      throw new Error('Could not fetch user from database');
    }
  }
}