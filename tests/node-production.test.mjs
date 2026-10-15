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
const testUser = { id: 'node-test-user', email: 'student@example.test', email_confirmed_at: new Date().toISOString(), user_metadata: { full_name: 'Student' } };
const auth = http.createServer((request, response) => {
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify(request.url.startsWith('/auth/v1/token') ? { access_token: 'test-access', refresh_token: 'test-refresh', expires_in: 3600, user: testUser } : testUser));
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
  child = spawn(process.execPath, ['--input-type=commonjs', '-e', "require('./server.js')"], {
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
  const publicHost = new URL(origin).host;
  const proxied = await request('/api/profile', { method: 'POST', headers: { origin: `https://${publicHost}`, 'x-forwarded-proto': 'https', 'x-forwarded-host': publicHost, 'content-type': 'application/json' }, body: '{}' });
  assert.equal(proxied.status, 401, 'same-site HTTPS behind the proxy reaches authentication instead of failing origin checks');
  const foreign = await request('/api/profile', { method: 'POST', headers: { origin: 'https://evil.example', 'x-forwarded-proto': 'https', 'x-forwarded-host': 'evil.example', 'content-type': 'application/json' }, body: '{}' });
  assert.equal(foreign.status, 403, 'untrusted forwarded hosts remain blocked');
  const secureHeaders = { origin: `https://${publicHost}`, 'x-forwarded-proto': 'https', 'x-forwarded-host': publicHost, 'content-type': 'application/json' };
  const login = await request('/api/auth/signin', { method: 'POST', headers: secureHeaders, body: JSON.stringify({ email: 'student@example.test', password: 'test-password-only', returnTo: '/learn' }) });
  assert.equal(login.status, 200, await login.clone().text());
  assert.equal((await login.json()).redirect, '/learn');
  const loginCookies = login.headers.getSetCookie();
  assert.ok(loginCookies.some(value => value.startsWith('__Host-wl-at=') && /Secure/i.test(value) && /HttpOnly/i.test(value)));
  const cookie = loginCookies.map(value => value.split(';')[0]).join('; ');
  const account = await request('/api/session', { headers: { ...secureHeaders, cookie } });
  assert.equal((await account.json()).signedIn, true);
  const logout = await request('/api/auth/signout', { method: 'POST', headers: { ...secureHeaders, cookie }, body: JSON.stringify({ returnTo: '/' }) });
  assert.equal(logout.status, 200, await logout.clone().text());
  assert.ok(logout.headers.getSetCookie().some(value => value.startsWith('__Host-wl-at=') && /Max-Age=0/i.test(value)));
  const afterLogout = await request('/api/session');
  assert.equal((await afterLogout.json()).signedIn, false);
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
