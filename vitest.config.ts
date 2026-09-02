import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Adaptadores externos (wrappers finos sobre el SDK de InsForge) y el
      // Composition Root no se testean en unit para evitar mockear el SDK.
      exclude: ['src/infrastructure/insforge/**', 'src/infrastructure/repositories/**', 'src/index.ts'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
