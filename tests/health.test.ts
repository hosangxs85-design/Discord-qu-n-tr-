import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, expect, it } from 'vitest';
import { createHealthServer } from '../src/health.js';

async function start(server: Server): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
}

describe('Render health endpoint', () => {
  it('returns a non-cached 200 JSON liveness response at /healthz', async () => {
    const server = createHealthServer();
    const baseUrl = await start(server);
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      expect(response.headers.get('cache-control')).toBe('no-store');
      await expect(response.json()).resolves.toEqual({ ok: true });
    } finally {
      await close(server);
    }
  });

  it('returns 404 for paths other than /healthz', async () => {
    const server = createHealthServer();
    const baseUrl = await start(server);
    try {
      const response = await fetch(`${baseUrl}/`);
      expect(response.status).toBe(404);
    } finally {
      await close(server);
    }
  });
});
