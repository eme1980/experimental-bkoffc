import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { createRequestLogger } from '../../../src/infrastructure/logger/requestLogger';
import { Logger } from '../../../src/infrastructure/logger/Logger';

describe('createRequestLogger', () => {
  const makeLogger = () => {
    const out = vi.fn();
    const err = vi.fn();
    const logger = new Logger({ level: 'info', out, err });
    return { out, err, logger };
  };

  let req: Partial<Request>;
  let res: Partial<Response> & { on: ReturnType<typeof vi.fn> };
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    req = { method: 'POST', originalUrl: '/auth/login' };
    res = { statusCode: 201, on: vi.fn() };
    next = vi.fn();
  });

  it('invoca next inmediatamente', () => {
    const { logger } = makeLogger();
    createRequestLogger(logger)(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('loguea la petición finalizada como JSON estructurado', () => {
    const { out, logger } = makeLogger();
    const middleware = createRequestLogger(logger);
    middleware(req as Request, res as Response, next);

    const finishHandler = res.on.mock.calls.find((c) => c[0] === 'finish')?.[1] as () => void;
    expect(finishHandler).toBeTypeOf('function');
    finishHandler();

    expect(out).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(out.mock.calls[0][0]);
    expect(parsed.level).toBe('info');
    expect(parsed.method).toBe('POST');
    expect(parsed.path).toBe('/auth/login');
    expect(parsed.status).toBe(201);
    expect(typeof parsed.durationMs).toBe('number');
    expect(parsed.durationMs).toBeGreaterThanOrEqual(0);
  });
});