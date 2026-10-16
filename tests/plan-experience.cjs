const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
test('plan AI limits follow the approved usage without changing mission points',()=>{
 const {planAllowance}=require('../lib/billing/allowances.ts');
 for(const [sku,limit] of [[null,3],['sprint',5],['plus_monthly',10],['plus_annual',10],['pro_monthly',25],['pro_annual',25],['teams_monthly',10]])assert.equal(planAllowance(sku).dailyAi,limit);
 assert.match(fs.readFileSync('lib/mission-score.ts','utf8'),/total:100/);
});
test('only verified active payment opens personalisation',()=>{
 const {paidOnboardingUrl}=require('../lib/billing/allowances.ts');
 assert.equal(paidOnboardingUrl({paidAccessActivated:true}),'/learn?personalise=1');
 for(const result of [{},{state:'created'},{paidAccessActivated:false},null])assert.equal(paidOnboardingUrl(result),null);
});
