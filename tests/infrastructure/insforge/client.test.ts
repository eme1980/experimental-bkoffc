import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const InsForgeClientMock = vi.fn();

vi.mock('@insforge/sdk', () => ({
  InsForgeClient: InsForgeClientMock,
}));

describe('insforge client module', () => {
  const ORIGINAL_URL = process.env.INSFORGE_URL;
  const ORIGINAL_KEY = process.env.INSFORGE_KEY;

  beforeEach(() => {
    InsForgeClientMock.mockClear();
    vi.resetModules();
    delete process.env.INSFORGE_URL;
    delete process.env.INSFORGE_KEY;
  });

  afterEach(() => {
    if (ORIGINAL_URL === undefined) delete process.env.INSFORGE_URL;
    else process.env.INSFORGE_URL = ORIGINAL_URL;
    if (ORIGINAL_KEY === undefined) delete process.env.INSFORGE_KEY;
    else process.env.INSFORGE_KEY = ORIGINAL_KEY;
  });

  it('should instantiate InsForgeClient from env configuration', async () => {
    process.env.INSFORGE_URL = 'https://insforge.example.com';
    process.env.INSFORGE_KEY = 'anon-test-key';

    const mod = await import('../../../src/infrastructure/insforge/client');

    expect(InsForgeClientMock).toHaveBeenCalledWith({
      baseUrl: 'https://insforge.example.com',
      anonKey: 'anon-test-key',
    });
    expect(mod.insforgeClient).toBeDefined();
  });

  it('should still construct (with empty config) when env vars are missing', async () => {
    const mod = await import('../../../src/infrastructure/insforge/client');

    expect(InsForgeClientMock).toHaveBeenCalledWith({
      baseUrl: undefined,
      anonKey: undefined,
    });
    expect(mod.insforgeClient).toBeDefined();
  });
});