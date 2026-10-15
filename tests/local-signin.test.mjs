// Local test sign-in for `pnpm start`: works only on this computer and never trusts sign-in headers sent by a browser. Run: node --test tests/local-signin.test.mjs
import assert from 'node:assert/strict';
import {handleAuth,isLocalRequest,safeReturn,localUser} from '../scripts/local-preview.mjs';
const local={host:'127.0.0.1:8787'};const req=(url,headers={},extra={})=>handleAuth({method:'GET',url,headers:{...local,...headers},remoteAddress:'127.0.0.1',...extra});
const signIn=req('/signin-with-chatgpt?return_to=/learn');assert.equal(signIn.status,302);assert.equal(signIn.headers.Location,'/learn');assert.match(signIn.headers['Set-Cookie'],/^__whatslearn_local_auth=1; Path=\/; HttpOnly; SameSite=Lax$/);
assert.equal(req('/signin-with-chatgpt?return_to=https://evil.example').headers.Location,'/');assert.equal(safeReturn('//evil.example'),'/');assert.equal(safeReturn('/settings?x=1'),'/settings?x=1');
const signedIn=req('/api/work',{cookie:'__whatslearn_local_auth=1; theme=dark'});assert.equal(signedIn.forward['oai-authenticated-user-email'],localUser.email);assert.equal(signedIn.forward.cookie,'theme=dark','Only the app’s own cookies are passed on');
assert.equal(req('/api/work').forward['oai-authenticated-user-id'],undefined,'Signed out without the cookie');
const forged=req('/api/work',{'oai-authenticated-user-id':'admin','oai-authenticated-user-email':'owner@example.com'});assert.equal(forged.forward['oai-authenticated-user-id'],undefined,'Sign-in headers sent by a browser are removed');
for(const host of ['whatslearn.in','evil.example:8787','192.168.1.20:8787','127.0.0.1.nip.io']){assert.equal(req('/signin-with-chatgpt',{host}).status,403,host);assert.equal(req('/api/work',{host,cookie:'__whatslearn_local_auth=1'}).forward['oai-authenticated-user-id'],undefined,host)}
assert.equal(req('/signin-with-chatgpt',{},{remoteAddress:'192.168.1.30'}).status,403,'Another machine cannot sign in');
assert.equal(req('/signin-with-chatgpt',{origin:'https://evil.example'}).status,403);assert.equal(req('/signin-with-chatgpt',{'sec-fetch-site':'cross-site'}).status,403);
assert.equal(handleAuth({method:'POST',url:'/signin-with-chatgpt',headers:local,remoteAddress:'127.0.0.1'}).status,405);
const out=handleAuth({method:'POST',url:'/signout-with-chatgpt?return_to=/',headers:local,remoteAddress:'::1'});assert.equal(out.status,303);assert.match(out.headers['Set-Cookie'],/Max-Age=0/);
assert.equal(isLocalRequest('localhost:8787','::ffff:127.0.0.1'),true);assert.equal(isLocalRequest('[::1]:8787','::1'),true);assert.equal(isLocalRequest('',''),false);
console.log('PASS: local sign-in is loopback-only, rejects other hosts and machines, strips forged sign-in headers, and signs out.');
