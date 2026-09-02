import { InsForgeClient } from '@insforge/sdk';
import { logger } from '../logger/Logger';

const config = {
  baseUrl: process.env.VITE_INSFORGE_URL,
  anonKey: process.env.VITE_INSFORGE_KEY,
};

if (!config.baseUrl || !config.anonKey) {
  logger.error('Falta la configuración de InsForge. Revisa VITE_INSFORGE_URL y VITE_INSFORGE_KEY.');
}

export const insforgeClient = new InsForgeClient(config);
