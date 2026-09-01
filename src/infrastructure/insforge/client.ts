import { InsForgeClient } from '@insforge/sdk';

const config = {
  baseUrl: process.env.VITE_INSFORGE_URL,
  anonKey: process.env.VITE_INSFORGE_KEY,
};

if (!config.baseUrl || !config.anonKey) {
  console.error('Missing InsForge configuration. Please check VITE_INSFORGE_URL and VITE_INSFORGE_KEY environment variables.');
}

export const insforgeClient = new InsForgeClient(config);
