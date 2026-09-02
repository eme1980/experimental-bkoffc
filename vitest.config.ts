import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // El Composition Root (src/index.ts) no se testea en unit. Los adaptadores
      // de InsForge (insforge/** y repositories/**) SÍ se cubren con mocks del SDK.
      // Los controllers/logger/middleware se cubren vía sus propios tests.
      exclude: ['src/index.ts'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
