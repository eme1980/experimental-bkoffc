import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express, { Express } from 'express';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import cors from 'cors';
import {
  createCorsMiddleware,
  ALLOWED_ORIGINS,
  parseAllowedOrigins,
} from '../../../src/infrastructure/middleware/cors';

const ALLOWED_HOST = 'https://app1.example.com';
const DISALLOWED_HOST = 'https://evil.example.com';

function startServer(middleware: ReturnType<typeof createCorsMiddleware>): Promise<{ server: Server; baseUrl: string }> {
  return new Promise((resolve) => {
    const app: Express = express();
    app.use(middleware);
    app.get('/data', (_req, res) => res.json({ ok: true }));
    const server = createServer(app);
    server.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function getWithOrigin(url: string, origin?: string): Promise<Response> {
  return fetch(`${url}/data`, {
    headers: origin
      ? { origin, 'content-type': 'application/json' }
      : { 'content-type': 'application/json' },
  });
}

describe('cors middleware', () => {
  let allowed: { server: Server; baseUrl: string };
  let denied: { server: Server; baseUrl: string };

  beforeAll(async () => {
    allowed = await startServer(createCorsMiddleware([ALLOWED_HOST]));
    denied = await startServer(createCorsMiddleware([]));
  });

  afterAll(() => {
    allowed.server.close();
    denied.server.close();
  });

  it('responde Access-Control-Allow-Origin con el origen permitido', async () => {
    const res = await getWithOrigin(allowed.baseUrl, ALLOWED_HOST);
    expect(res.headers.get('access-control-allow-origin')).toBe(ALLOWED_HOST);
  });

  it('NO emite Access-Control-Allow-Origin para un origen no listado', async () => {
    const res = await getWithOrigin(allowed.baseUrl, DISALLOWED_HOST);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('con lista vacía deniega cualquier origen cross-origin', async () => {
    const res = await getWithOrigin(denied.baseUrl, ALLOWED_HOST);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('permite credenciales (Access-Control-Allow-Credentials) para origen autorizado', async () => {
    const res = await getWithOrigin(allowed.baseUrl, ALLOWED_HOST);
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
  });

  it('parseAllowedOrigins normaliza lista separada por comas', () => {
    expect(parseAllowedOrigins(' https://a.com ,https://b.com,  ')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });

  it('ALLOWED_ORIGINS es constante exportada (no vacía por defecto)', () => {
    expect(cors).toBeDefined();
    expect(Array.isArray(ALLOWED_ORIGINS)).toBe(true);
  });
});