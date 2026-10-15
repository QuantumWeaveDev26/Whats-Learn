#!/usr/bin/env node
/**
 * Built local preview with a development-only test sign-in. Run with `pnpm start` after `pnpm build`.
 *
 * Production never runs this file: hosting serves the built Worker and ChatGPT sign-in is handled by the host.
 * Here, Wrangler serves the built site on an internal loopback port, and a small proxy in front of it on
 * http://127.0.0.1:8787 adds the same simulated sign-in as `pnpm dev` (test user seedy@sites.test).
 * The proxy listens on 127.0.0.1 only and refuses sign-in for any request whose Host or caller is not this computer.
 * No password, email or phone number is collected. `pnpm start:no-signin` starts the preview without it.
 * Settings come from .env and .env.local in the project folder (Wrangler would otherwise look next to the build).
 */
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pendingMigrations} from './local-db.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
export const localUser={id:'local_seedy',email:'seedy@sites.test',name:'Seedy'};
const cookieName='__whatslearn_local_auth';
const authPaths=new Set(['/signin-with-chatgpt','/signout-with-chatgpt','/callback']);
const localHosts=new Set(['localhost','127.0.0.1','::1']);
const localAddresses=new Set(['127.0.0.1','::1','::ffff:127.0.0.1']);

/** True only for a request made on this computer to a loopback host name. Guards against other machines and DNS rebinding. */
export function isLocalRequest(hostHeader,remoteAddress){
 let host;try{host=new URL(`http://${hostHeader||''}`).hostname.replace(/^\[|\]$/g,'').toLowerCase()}catch{return false}
 return localHosts.has(host)&&localAddresses.has(remoteAddress||'');
}
export function safeReturn(value){
 if(!value?.startsWith('/')||value.startsWith('//'))return '/';
 try{const u=new URL(value,'http://localhost');if(u.origin!=='http://localhost'||authPaths.has(u.pathname))return '/';return u.pathname+u.search+u.hash}catch{return '/'}
}
/** Decides what the proxy does with one request: a direct response ({status}) or the headers to forward ({forward}). */
export function handleAuth({method,url,headers,remoteAddress}){
 const out={...headers};for(const k of Object.keys(out))if(k.startsWith('oai-authenticated-user-'))delete out[k];
 const pathname=(url||'/').split('?')[0];
 if(!isLocalRequest(headers.host,remoteAddress))return authPaths.has(pathname)?{status:403}:{forward:out};
 const cookies=(headers.cookie||'').split(';').map(c=>c.trim()).filter(Boolean);
 const signedIn=cookies.includes(`${cookieName}=1`);
 const rest=cookies.filter(c=>!c.startsWith(cookieName+'='));if(rest.length)out.cookie=rest.join('; ');else delete out.cookie;
 if(pathname==='/callback')return {status:501};
 const signIn=pathname==='/signin-with-chatgpt',signOut=pathname==='/signout-with-chatgpt';
 if(!signIn&&!signOut){
  if(signedIn){out['oai-authenticated-user-id']=localUser.id;out['oai-authenticated-user-email']=localUser.email;out['oai-authenticated-user-full-name']=localUser.name;out['oai-authenticated-user-full-name-encoding']='percent-encoded-utf-8'}
  return {forward:out};
 }
 if((headers.origin&&headers.origin!==`http://${headers.host}`)||headers['sec-fetch-site']==='cross-site')return {status:403};
 if(method!=='GET'&&!(signOut&&method==='POST'))return {status:405};
 const q=new URL(url,'http://localhost').searchParams;
 return {status:method==='POST'?303:302,headers:{Location:safeReturn(q.get('return_to')),'Set-Cookie':`${cookieName}=${signIn?'1':''}; Path=/; ${signOut?'Max-Age=0; ':''}HttpOnly; SameSite=Lax`}};
}

function main(){
 const args=process.argv.slice(2);const opt=(name,fallback)=>{const i=args.indexOf(name);return i>=0&&args[i+1]?args[i+1]:fallback};
 const port=Number(opt('--port',process.env.PORT||8787)),innerPort=Number(opt('--inner-port',port+1));const signInEnabled=!args.includes('--no-signin');
 if(!existsSync(path.join(root,'dist','server','wrangler.json'))){console.error('No built site found. Run `pnpm build` first, then `pnpm start`.');process.exit(1)}
 const envFiles=['.env','.env.local'].filter(f=>existsSync(path.join(root,f)));
 const pending=pendingMigrations();
 const wranglerArgs=['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','dev','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--ip','127.0.0.1','--port',String(signInEnabled?innerPort:port),'--inspector-port','0',...envFiles.flatMap(f=>['--env-file',path.join(root,f)])];
 const child=spawn(process.execPath,wranglerArgs,{cwd:root,stdio:'inherit'});
 const stop=()=>{child.kill();process.exit(0)};process.on('SIGINT',stop);process.on('SIGTERM',stop);child.on('exit',code=>process.exit(code??0));
 console.log(`\nWhatsLearn local preview: http://127.0.0.1:${port}`);
 console.log(envFiles.length?`Settings read from ${envFiles.join(' and ')} (values are not shown).`:'No .env.local found, so payments, AI review and WhatsApp stay off. Copy .env.example to .env.local to add test settings.');
 if(pending.length)console.log(`Local database: ${pending.length} migration(s) not applied. Stop this window (Ctrl+C), run \`pnpm db:local\`, then \`pnpm start\` again. Saving progress, the updates feed and payments need them.`);
 if(!signInEnabled){console.log('Local test sign-in is OFF.\n');return}
 console.log(`Local test sign-in is ON for this computer only. Use "Sign up / Sign in" on the site, or open http://127.0.0.1:${port}/signin-with-chatgpt?return_to=/learn (test user ${localUser.email}).\n`);
 const server=http.createServer((req,res)=>{
  const d=handleAuth({method:req.method,url:req.url,headers:req.headers,remoteAddress:req.socket.remoteAddress});
  if(d.status){res.writeHead(d.status,{'Cache-Control':'private, no-store',...(d.headers||{})});res.end();return}
  const up=http.request({host:'127.0.0.1',port:innerPort,method:req.method,path:req.url,headers:d.forward},r=>{res.writeHead(r.statusCode||502,r.headers);r.pipe(res)});
  up.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'text/plain; charset=utf-8'});res.end('The local preview is still starting. Refresh in a few seconds.')});
  req.pipe(up);
 });
 server.on('error',e=>{console.error(`Could not use port ${port} (${e.code}). Close the other preview, or run: pnpm start --port 8790`);child.kill();process.exit(1)});
 server.listen(port,'127.0.0.1');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
