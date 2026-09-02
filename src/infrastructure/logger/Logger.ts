/**
 * Logger mínimo y estructurado sin dependencias externas.
 *
 * Emite una línea JSON por evento a stdout (debug/info) o stderr (warn/error),
 * pensado para ser consumido por la agregación de logs de Dokploy. Niveles:
 * debug < info < warn < error. El nivel mínimo se configura con `LOG_LEVEL`
 * (por defecto `info`). Serializable: metadatos planos, `Error` y objetos
 * son soportados por igual.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Orden de severidad de los niveles. */
const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const DEFAULT_LEVEL: LogLevel = 'info';

/** Normaliza un valor a LogLevel válido, o al default si no lo es. */
function toLevel(value: unknown): LogLevel {
  if (typeof value === 'string' && value in LEVEL_ORDER) {
    return value as LogLevel;
  }
  return DEFAULT_LEVEL;
}

type Sink = (line: string) => void;

/** Reduce cualquier metadato a un objeto serializable a JSON. */
function toMeta(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) return undefined;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return { value };
}

export interface LoggerOptions {
  /** Nivel mínimo emisible. Por defecto: valor de `LOG_LEVEL` o `info`. */
  level?: LogLevel;
  /** Sink de salida para debug/info/warn. Por defecto: `console.log`. */
  out?: Sink;
  /** Sink de salida para error. Por defecto: `console.error`. */
  err?: Sink;
}

export class Logger {
  private readonly threshold: number;
  private readonly out: Sink;
  private readonly err: Sink;

  constructor(options: LoggerOptions = {}) {
    const level = options.level ?? process.env.LOG_LEVEL ?? DEFAULT_LEVEL;
    this.threshold = LEVEL_ORDER[toLevel(level)];
    this.out = options.out ?? ((line) => console.log(line));
    this.err = options.err ?? ((line) => console.error(line));
  }

  debug(message: string, meta?: unknown): void {
    this.write('debug', message, meta);
  }

  info(message: string, meta?: unknown): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: unknown): void {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: unknown): void {
    this.write('error', message, meta);
  }

  private write(level: LogLevel, message: string, meta?: unknown): void {
    if (LEVEL_ORDER[level] < this.threshold) return;
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    if (meta instanceof Error) {
      entry.meta = toMeta(meta);
    } else {
      const serializableMeta = toMeta(meta);
      if (serializableMeta) {
        Object.assign(entry, serializableMeta);
      }
    }
    const line = JSON.stringify(entry);
    if (level === 'error') {
      this.err(line);
    } else {
      this.out(line);
    }
  }
}

/** Instancia compartida, configurada desde `LOG_LEVEL` para todo el proceso. */
export const logger = new Logger();