import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import {
  loginRateLimiter,
  resetPasswordRequestRateLimiter,
  LOGIN_MAX_ATTEMPTS,
  RESET_REQUEST_MAX,
} from '../../../src/infrastructure/middleware/rateLimit';

import type { RateLimitRequestHandler } from 'express-rate-limit';

function startServer(limiter: RateLimitRequestHandler): Promise<{ server: Server; baseUrl: string }> {
  return new Promise((resolve) => {
    const app: Express = express();
    app.post('/limited', limiter, (_req, res) => {
      res.json({ ok: true });
    });
    const server = createServer(app);
    server.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function post(url: string): Promise<number> {
  const res = await fetch(`${url}/limited`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'Password123!' }),
  });
  return res.status;
}

describe('rate limiting middleware', () => {
  let login: { server: Server; baseUrl: string };
  let reset: { server: Server; baseUrl: string };

  beforeAll(async () => {
    login = await startServer(loginRateLimiter);
    reset = await startServer(resetPasswordRequestRateLimiter);
  });

  afterAll(() => {
    login.server.close();
    reset.server.close();
  });

  it('loginRateLimiter allows LOGIN_MAX_ATTEMPTS requests and blocks the next', async () => {
    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i++) {
      expect(await post(login.baseUrl)).toBe(200);
    }
    expect(await post(login.baseUrl)).toBe(429);
  });

  it('resetPasswordRequestRateLimiter allows RESET_REQUEST_MAX requests and blocks the next', async () => {
    for (let i = 0; i < RESET_REQUEST_MAX; i++) {
      expect(await post(reset.baseUrl)).toBe(200);
    }
    expect(await post(reset.baseUrl)).toBe(429);
  });

  it('applies a stricter limit to the reset-request endpoint than to login', () => {
    expect(RESET_REQUEST_MAX).toBeLessThan(LOGIN_MAX_ATTEMPTS);
  });
});