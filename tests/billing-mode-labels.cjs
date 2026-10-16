const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');

test('live and test plan keys display their catalogue names',()=>{
 require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
 const {billingPlanName}=require('../lib/billing/display.ts');
 assert.equal(billingPlanName('live:plus_monthly'),'Plus monthly');
 assert.equal(billingPlanName('pro_annual'),'Pro annual');
 assert.equal(billingPlanName('live:teams_monthly'),'Teams per learner monthly');
});

test('owner setup explains the current mode and distinguishes saved test sessions',()=>{
 const s=fs.readFileSync('components/whatslearn/billing-setup.tsx','utf8');
 assert.match(s,/state\?\.mode==='live'/);
 assert.match(s,/Create live plans/);
 assert.match(s,/billingPlanName\(p\.sku\)/);
 assert.match(s,/s\.mode==='live'/);
 assert.match(s,/disabled=\{busy\|\|!sameMode\}/,'test sessions must not call Razorpay using live credentials');
 const setup=fs.readFileSync('lib/billing/setup.ts','utf8');
 assert.match(setup,/mode==='live'\?'Live plans/);
 assert.ok(!fs.readFileSync('app/page.tsx','utf8').includes('nothing is charged today'),'home must not claim payments are off when live checkout can be enabled');
});
