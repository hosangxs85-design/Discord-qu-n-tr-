import { config } from './config.js';
const levels = ['debug', 'info', 'warn', 'error'] as const;
type Level = typeof levels[number];
export function log(level: Level, message: string, meta?: Record<string, unknown>) {
  if (levels.indexOf(level) < levels.indexOf(config.LOG_LEVEL)) return;
  const safeMeta = meta ? JSON.stringify(meta) : '';
  console.log(`${new Date().toISOString()} [${level.toUpperCase()}] ${message} ${safeMeta}`.trim());
}
