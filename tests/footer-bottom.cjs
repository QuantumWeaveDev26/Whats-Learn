const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('app/globals.css','utf8');
test('short onboarding pages stretch their main content and keep the footer at the end',()=>{
 assert.match(css,/\.public-app,\.path-wizard\{[^}]*min-height:100dvh;[^}]*display:flex;flex-direction:column/);
 assert.match(css,/\.path-wizard>main\{[^}]*flex:1;min-height:0;margin:0 auto/);
 assert.match(css,/\.path-wizard>\.path-footer\{[^}]*margin-top:auto;justify-content:flex-end/);
 const page=fs.readFileSync('app/find-my-path/page.tsx','utf8');
 assert.match(page,/<footer className="path-footer"><span>WhatsLearn/);
});
test('footer links align right across account, course and home screens without fixed overlays',()=>{
 for(const selector of ['.account-footer','.workspace>footer','.brand-footer-bottom']){
  const last=[...css.matchAll(new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\{([^}]+)\\}','g'))].filter(m=>m[1].includes('justify-content:flex-end'));
  assert.ok(last.length,selector+' aligns right');
  assert.ok(last.every(m=>!m[1].includes('position:fixed')),selector+' stays in document flow');
 }
 assert.doesNotMatch(css,/account-footer\{padding-right:320px\}/);
 assert.match(css,/body:not\(:has\(\.whatsapp-mentor-widget\)\) \.account-footer\{padding-bottom:24px\}/);
 assert.match(css,/\.account-footer nav,\.path-footer>\.site-legal-links\{justify-content:flex-end;gap:12px 18px\}/);
});
