import type { NextFunction, Request, Response } from 'express';
import type { Logger } from './Logger';

/**
 * Middleware Express que emite una línea JSON estructurada (nivel `info`)
 * cuando una petición HTTP finaliza. Pensado para observabilidad en Dokploy:
 * método, ruta, código de estado y duración en ms para cada request.
 */
export function createRequestLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = Date.now();
    res.on('finish', () => {
      logger.info('request completed', {
        method: req.method,
        path: req.originalUrl ?? req.url,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });
    next();
  };
}