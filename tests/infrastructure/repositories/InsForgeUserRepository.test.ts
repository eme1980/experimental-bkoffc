import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InsForgeUserRepository } from '../../../src/infrastructure/repositories/InsForgeUserRepository';
import { insforgeClient } from '../../../src/infrastructure/insforge/client';

vi.mock('../../../src/infrastructure/insforge/client', () => ({
  insforgeClient: {
    database: {
      from: vi.fn(),
    },
  },
}));

describe('InsForgeUserRepository.save', () => {
  let repo: InsForgeUserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new InsForgeUserRepository();
  });

  it('should UPDATE an existing user (has id) instead of inserting', async () => {
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      resetToken: 'abc123',
      resetTokenExpires: new Date('2026-01-01T00:00:00Z'),
    };

    const eqMock = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    const qb: any = { update: vi.fn().mockReturnValue({ eq: eqMock }) };
    vi.mocked(insforgeClient.database.from).mockReturnValue(qb);

    await repo.save(user);

    expect(qb.update).toHaveBeenCalledWith({
      id: 'user-123',
      email: 'test@example.com',
      reset_token: 'abc123',
      reset_token_expires_at: '2026-01-01T00:00:00.000Z',
    });
    expect(eqMock).toHaveBeenCalledWith('id', 'user-123');
  });

  it('should INSERT a new user when it has no id', async () => {
    const user = { email: 'new@example.com' };

    const insertReturn = {
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const qb: any = { insert: vi.fn().mockReturnValue(insertReturn) };
    vi.mocked(insforgeClient.database.from).mockReturnValue(qb);

    await repo.save(user);

    expect(qb.insert).toHaveBeenCalledWith({
      id: undefined,
      email: 'new@example.com',
      reset_token: null,
      reset_token_expires_at: null,
    });
  });
});
