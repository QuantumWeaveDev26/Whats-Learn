#!/usr/bin/env node
/**
 * Local test stand-in for the managed auth provider, so the email sign-up journey can be tried on this computer without an account anywhere.
 * Listens on 127.0.0.1 only. Writes every "email" it would send to .wrangler/fake-auth-outbox.json so you can open the links.
 * Run:  node scripts/fake-auth-provider.mjs   then put these in .env.local:
 *   SUPABASE_URL=http://127.0.0.1:54321   SUPABASE_PUBLISHABLE_KEY=pub-test-key   SUPABASE_SERVICE_ROLE_KEY=svc-test-key   SITE_URL=http://127.0.0.1:8787
 * These values are fake test values, not secrets. Never point a real site at this.
 */
import http from 'node:http';import fs from 'node:fs';import {createRequire} from 'node:module';
const {FakeGoTrue}=createRequire(import.meta.url)('./fake-auth-core.cjs');
const port=Number(process.env.FAKE_AUTH_PORT||54321);const fake=new FakeGoTrue();
fs.mkdirSync('.wrangler',{recursive:true});const save=()=>fs.writeFileSync('.wrangler/fake-auth-outbox.json',JSON.stringify(fake.outbox,null,1));
http.createServer((req,res)=>{let b='';req.on('data',d=>b+=d);req.on('end',()=>{
 const u=new URL(req.url,'http://127.0.0.1');if(!u.pathname.startsWith('/auth/v1/')){res.writeHead(404).end();return}
 let body;try{body=b?JSON.parse(b):undefined}catch{res.writeHead(400).end();return}
 const r=fake.handle(req.method,u.pathname.slice('/auth/v1/'.length),Object.fromEntries(u.searchParams),body,Object.fromEntries(Object.entries(req.headers)));save();
 res.writeHead(r.status,{'Content-Type':'application/json'}).end(r.status===204?'':JSON.stringify(r.json));});}).listen(port,'127.0.0.1',()=>console.log(`Fake auth provider on http://127.0.0.1:${port} (tests only)`));
