import { describe, it, expect } from 'vitest';
import { hashToken } from '../../../src/core/security/hashToken';

describe('hashToken', () => {
  it('returns a 64-character lowercase hex sha256 digest', () => {
    const hash = hashToken('valid-token');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same input', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
  });

  it('produces different hashes for different tokens', () => {
    expect(hashToken('abc')).not.toBe(hashToken('abd'));
  });
});