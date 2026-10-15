import { join } from 'node:path';

// Hostinger terminates HTTPS before forwarding requests to the Node process.
// Allow only this site's forwarded host, keeping origin and secure-cookie checks intact.
const hosts = process.env.SITE_URL
  ? [new URL(process.env.SITE_URL).host]
  : ['whatslearn.in', 'www.whatslearn.in'];
process.env.VINEXT_TRUSTED_HOSTS ??= hosts.join(',');
import('vinext/server/prod-server').then(({ startProdServer }) => startProdServer({
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  host: process.env.HOST ?? '0.0.0.0',
  outDir: join(import.meta.dirname, 'dist'),
})).catch(error => { console.error('[WhatsLearn] Server startup failed:', error); process.exit(1); });
