/**
 * AppLogger — Centralized Winston-based logger.
 *
 * Two file transports with automatic rotation:
 *   logs/access.log  — every HTTP request (info level)
 *                      Rotates at 10 MB; 5 rotated files kept.
 *   logs/error.log   — errors only (error level)
 *                      Rotates at 5 MB; 10 rotated files kept.
 *
 * Rotation is handled by Winston's built-in File transport options
 * (maxsize + maxFiles) — no external package required.
 * Satisfies: "Log and Error Management: stored in files at regular intervals."
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
    // access.log — all requests and general info, rotates at 10 MB (keeps 5 files)
    new winston.transports.File({
      filename: join(LOGS_DIR, 'access.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024, // 10 MB per file
      maxFiles: 5,               // keep up to 5 rotated files
      tailable: true,            // most recent data always in access.log
    }),
    // error.log — only errors (and above), rotates at 5 MB (keeps 10 files)
    new winston.transports.File({
      filename: join(LOGS_DIR, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5 MB per file
      maxFiles: 10,             // keep up to 10 rotated error files
      tailable: true,
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
