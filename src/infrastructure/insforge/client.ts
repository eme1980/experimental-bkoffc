import { InsForgeClient } from '@insforge/sdk';
import { logger } from '../logger/Logger';

const config = {
  baseUrl: process.env.INSFORGE_URL,
  anonKey: process.env.INSFORGE_KEY,
};

if (!config.baseUrl || !config.anonKey) {
  logger.error('Falta la configuración de InsForge. Revisa INSFORGE_URL y INSFORGE_KEY.');
}

export const insforgeClient = new InsForgeClient(config);