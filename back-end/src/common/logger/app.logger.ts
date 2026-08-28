/**
 * AppLogger — Centralized Winston-based logger.
 *
 * Two file transports:
 *   logs/access.log  — every HTTP request (info level)
 *   logs/error.log   — errors only (error level)
 *
 * The /logs directory is created automatically at startup.
 * Log files are appended across restarts (not truncated).
 */

import * as winston from 'winston';
import { mkdirSync } from 'fs';
import { join } from 'path';

const LOGS_DIR = join(process.cwd(), 'logs');

// Auto-create the logs directory so it exists before any request is logged
mkdirSync(LOGS_DIR, { recursive: true });

const { combine, timestamp, printf, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const base = `[${ts}] [${level.toUpperCase()}] ${message}`;
  const extras = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
  const stackStr = stack ? `\n${stack}` : '';
  return `${base}${extras}${stackStr}`;
});

export const AppLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat,
  ),
  transports: [
    // access.log — all requests and general info
    new winston.transports.File({
      filename: join(LOGS_DIR, 'access.log'),
      level: 'info',
    }),
    // error.log — only errors (and above)
    new winston.transports.File({
      filename: join(LOGS_DIR, 'error.log'),
      level: 'error',
    }),
    // Console transport for development visibility
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'HH:mm:ss' }),
        logFormat,
      ),
    }),
  ],
});
