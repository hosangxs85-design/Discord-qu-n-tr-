import { createServer, type Server } from 'node:http';

export function createHealthServer(): Server {
  return createServer((request, response) => {
    const pathname = (request.url ?? '/').split('?')[0];
    if (pathname !== '/healthz') {
      response.writeHead(404, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ ok: false, error: 'not found' }));
      return;
    }

    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8'
    });
    response.end(JSON.stringify({ ok: true }));
  });
}
