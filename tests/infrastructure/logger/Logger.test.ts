import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Logger, LogLevel } from '../../../src/infrastructure/logger/Logger';

describe('Logger', () => {
  let out: ReturnType<typeof vi.fn>;
  let err: ReturnType<typeof vi.fn>;

  const makeLogger = (level?: LogLevel) => new Logger({ level, out, err });

  beforeEach(() => {
    out = vi.fn();
    err = vi.fn();
  });

  describe('niveles de log', () => {
    it('emite info por stdout como JSON estructurado', () => {
      const logger = makeLogger('info');
      logger.info('Server running', { port: 3000 });

      expect(err).not.toHaveBeenCalled();
      expect(out).toHaveBeenCalledTimes(1);
      const parsed = JSON.parse(out.mock.calls[0][0]);
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('Server running');
      expect(parsed.port).toBe(3000);
      expect(typeof parsed.timestamp).toBe('string');
    });

    it('emite error por stderr con nivel error', () => {
      const logger = makeLogger('info');
      logger.error('InsForge unavailable', { code: 'ECONN' });

      expect(out).not.toHaveBeenCalled();
      expect(err).toHaveBeenCalledTimes(1);
      expect(JSON.parse(err.mock.calls[0][0]).level).toBe('error');
    });

    it('reprime niveles por debajo del umbral configurado', () => {
      const logger = makeLogger('info');
      logger.debug('detalle de debug');
      logger.info('un info');
      expect(out).toHaveBeenCalledTimes(1);
      expect(JSON.parse(out.mock.calls[0][0]).message).toBe('un info');
    });

    it('incluye debug/warn cuando el nivel lo permite', () => {
      const logger = makeLogger('debug');
      logger.debug('detalle');
      logger.warn('cuidado');
      const msgs = out.mock.calls.map((c) => JSON.parse(c[0]).message);
      expect(msgs).toEqual(['detalle', 'cuidado']);
    });

    it('admite sin nivel explícito (default info, consolas reales)', () => {
      const logger = new Logger();
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('metadatos', () => {
    it('serializa un Error a {name, message, stack} bajo la clave meta y marca level error', () => {
      const logger = makeLogger('debug');
      const boom = new Error('boom');
      logger.error('Fallo al procesar', boom);

      const parsed = JSON.parse(err.mock.calls[0][0]);
      expect(parsed.level).toBe('error');
      expect(parsed.meta).toBeDefined();
      expect(parsed.meta.name).toBe('Error');
      expect(parsed.meta.message).toBe('boom');
      expect(typeof parsed.meta.stack).toBe('string');
    });

    it('acepta objetos planos como metadatos además del mensaje', () => {
      const logger = makeLogger('info');
      logger.info('request completado', { path: '/auth/login', status: 200 });
      const parsed = JSON.parse(out.mock.calls[0][0]);
      expect(parsed.path).toBe('/auth/login');
      expect(parsed.status).toBe(200);
    });
  });
});