import { config } from './config.js';
import { createHealthServer } from './health.js';

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const server = createHealthServer();
await new Promise<void>((resolve, reject) => {
  const onError = (error: Error) => {
    server.off('listening', onListening);
    reject(error);
  };
  const onListening = () => {
    server.off('error', onError);
    resolve();
  };
  server.once('error', onError);
  server.once('listening', onListening);
  server.listen(port, '0.0.0.0');
});

console.info(`[health] HTTP health endpoint listening on 0.0.0.0:${port}`);

if (config.REGISTER_COMMANDS_ON_START === 'true') {
  await import('./deploy-commands.js');
}
