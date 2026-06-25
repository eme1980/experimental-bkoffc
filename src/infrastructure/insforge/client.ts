import { InsForgeClient } from '@insforge/sdk';

const config = {
  url: import.meta.env.VITE_INSFORGE_URL,
  key: import.meta.env.VITE_INSFORGE_KEY,
};

if (!config.url || !config.key) {
  console.error('Missing InsForge configuration. Please check VITE_INSFORGE_URL and VITE_INSFORGE_KEY environment variables.');
}

export const insforgeClient = new InsForgeClient(config);
