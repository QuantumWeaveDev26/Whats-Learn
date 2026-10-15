// Direct WhatsApp chat links: one number, a prefilled friendly message, new tab, and no leftover hard-coded links. Run: node --test tests/contact-link.cjs
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const src=fs.readFileSync(path.resolve(__dirname,'../lib/contact.ts'),'utf8');const m={exports:{}};new Function('module','exports',ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m,m.exports);
const c=m.exports;
assert.equal(c.whatsappChatUrl(),'https://wa.me/919972965677?text=Hi%2C%20I%E2%80%99d%20like%20to%20speak%20with%20the%20WhatsLearn%20team.');
const u=new URL(c.whatsappChatUrl('Refund & help?'));assert.equal(u.origin+u.pathname,'https://wa.me/919972965677');assert.equal(u.searchParams.get('text'),'Refund & help?');
assert.deepEqual(c.whatsappLinkProps,{target:'_blank',rel:'noopener noreferrer'});
const files=[];const walk=d=>{for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(/\.tsx?$/.test(f.name))files.push(p)}};
for(const d of ['app','components'])walk(path.resolve(__dirname,'..',d));
const direct=files.filter(f=>fs.readFileSync(f,'utf8').includes('wa.me/919972965677'));assert.deepEqual(direct,[],'Contact links use lib/contact.ts, not a hard-coded number');
const uses=files.filter(f=>fs.readFileSync(f,'utf8').includes('whatsappChatUrl(')).length;assert.equal(uses,8,'The same eight contact points as before, no new ones');
for(const f of files){const t=fs.readFileSync(f,'utf8');const n=(t.match(/whatsapp(?:Chat|Learning)Url\(/g)||[]).length,p=(t.match(/\{\.\.\.whatsappLinkProps\}/g)||[]).length;assert.equal(p,n,`${f}: every chat link opens in a new tab`)}
console.log('PASS: WhatsApp chat link format, prefilled message, new tab, and one shared number.');
