// Run after pnpm build. Uses a copied deployment and a local stand-in auth provider.
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const deployed = mkdtempSync(path.join(tmpdir(), 'whatslearn-production-'));
const data = mkdtempSync(path.join(tmpdir(), 'whatslearn-data-'));
const auth = http.createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ id: 'node-test-user', email: 'student@example.test', email_confirmed_at: new Date().toISOString(), user_metadata: { full_name: 'Student' } }));
});
auth.listen(0, '127.0.0.1');
await once(auth, 'listening');
const reserve = http.createServer();
reserve.listen(0, '127.0.0.1'); await once(reserve, 'listening');
const port = reserve.address().port;
await new Promise(resolve => reserve.close(resolve));
const origin = `http://127.0.0.1:${port}`;
let child;
let logs = '';
try {
  cpSync('dist/standalone', deployed, { recursive: true });
  child = spawn(process.execPath, ['server.js'], {
    cwd: deployed,
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', WHATSLEARN_DATA_DIR: data, SUPABASE_URL: `http://127.0.0.1:${auth.address().port}`, SUPABASE_PUBLISHABLE_KEY: 'test-placeholder', SITE_URL: origin },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', data => { logs += data; });
  child.stderr.on('data', data => { logs += data; });
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) throw new Error(logs);
    try { await fetch(origin); ready = true; break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  assert.ok(ready, logs);
  const request = (url, options = {}) => fetch(origin + url, options);
  const guest = await request('/api/session', { headers: { 'oai-authenticated-user-id': 'forged', 'oai-authenticated-user-email': 'forged@example.test' } });
  assert.equal(guest.status, 200); assert.equal((await guest.json()).signedIn, false);
  const settings = await request('/api/auth/config');
  assert.equal(settings.status, 200); assert.equal((await settings.json()).emailPassword, true);
  const companion = await request('/companion');
  assert.equal(companion.status, 200);
  const html = await companion.text();
  assert.ok(html.includes('g-683b056072048191a84d71e799ecbc26'));
  assert.ok(html.includes('wa.me/919187951536'));
  const headers = { cookie: 'wl-at=test-token', origin, 'content-type': 'application/json' };
  const work = await request('/api/work', { headers });
  assert.equal(work.status, 200, await work.clone().text());
  assert.equal((await work.json()).points.balance, 50);
  const repeat = await request('/api/work', { headers });
  assert.equal((await repeat.json()).points.balance, 50);
  const clue = () => request('/api/clues', { method: 'POST', headers, body: JSON.stringify({ missionId: 'm1', clue: 'hint' }) });
  const charge = await clue();
  assert.equal(charge.status, 200, await charge.clone().text());
  assert.equal((await charge.json()).balance, 45);
  const repeated = await clue();
  assert.equal((await repeated.json()).balance, 45);
  console.log('Isolated Node deployment passed: session, email configuration, GPT, WhatsApp, 50 starting points and one-time hint charge.');
} finally {
  if (child && child.exitCode === null) { const stopped = once(child, 'exit'); child.kill(); await stopped; }
  await new Promise(resolve => auth.close(resolve));
  rmSync(deployed, { recursive: true, force: true });
  rmSync(data, { recursive: true, force: true });
}
