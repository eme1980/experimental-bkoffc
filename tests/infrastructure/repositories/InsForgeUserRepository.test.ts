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

  it('should throw when save fails on the database', async () => {
    const user = { id: 'user-123', email: 'test@example.com' };

    const eqMock = vi.fn().mockReturnValue({
      select: vi.fn().mockRejectedValue(new Error('db down')),
    });
    const qb: any = { update: vi.fn().mockReturnValue({ eq: eqMock }) };
    vi.mocked(insforgeClient.database.from).mockReturnValue(qb);

    await expect(repo.save(user)).rejects.toThrow('Could not save user to database');
  });
});

describe('InsForgeUserRepository.find', () => {
  let repo: InsForgeUserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new InsForgeUserRepository();
  });

  // Reproduce la cadena fluida .from().select().eq().maybeSingle()
  function mockQuery(row: Record<string, unknown> | null, error: unknown = null) {
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    vi.mocked(insforgeClient.database.from).mockReturnValue({ select } as any);
    return { eq, select, maybeSingle };
  }

  it('findByEmail: should map columns and use eq on email', async () => {
    const { eq, select } = mockQuery({
      id: 'user-123',
      email: 'test@example.com',
      reset_token: 'tok-abc',
      reset_token_expires_at: '2026-01-01T12:00:00.000Z',
    });

    const result = await repo.findByEmail('test@example.com');

    expect(insforgeClient.database.from).toHaveBeenCalledWith('users');
    expect(select).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('email', 'test@example.com');
    expect(result).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      resetToken: 'tok-abc',
      resetTokenExpires: new Date('2026-01-01T12:00:00.000Z'),
    });
  });

  it('findByResetToken: should filter on reset_token column and map resetToken', async () => {
    const { eq } = mockQuery({
      id: 'user-9',
      email: 'another@example.com',
      reset_token: 'reset-zz',
      reset_token_expires_at: '2026-02-02T00:00:00.000Z',
    });

    const result = await repo.findByResetToken('reset-zz');

    expect(eq).toHaveBeenCalledWith('reset_token', 'reset-zz');
    expect(result?.resetToken).toBe('reset-zz');
    expect(result?.resetTokenExpires).toEqual(new Date('2026-02-02T00:00:00.000Z'));
  });

  it('should map null columns when reset_token / expires_at are absent', async () => {
    mockQuery({
      id: 'user-1',
      email: 'plain@example.com',
      reset_token: null,
      reset_token_expires_at: null,
    });

    const result = await repo.findByEmail('plain@example.com');

    expect(result?.resetToken).toBeNull();
    expect(result?.resetTokenExpires).toBeNull();
  });

  it('should return null when no user matches the filter', async () => {
    mockQuery(null);

    const result = await repo.findByResetToken('nope');

    expect(result).toBeNull();
  });

  it('should throw when the query returns an error', async () => {
    mockQuery(null, { message: 'boom' });

    await expect(repo.findByEmail('x@example.com')).rejects.toThrow(
      'Could not fetch user from database',
    );
  });

  it('should throw when the DB call rejects', async () => {
    const maybeSingle = vi.fn().mockRejectedValue(new Error('timeout'));
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    vi.mocked(insforgeClient.database.from).mockReturnValue({ select } as any);

    await expect(repo.findByResetToken('t')).rejects.toThrow('Could not fetch user from database');
  });
});
