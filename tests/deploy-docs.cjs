// The deployment guide and .env.example stay in step: every new setting is documented, placeholders are empty, and the off-by-default features really are off.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('every v40 setting is in .env.example (empty) and in the deployment guide',()=>{
 const ex=read('.env.example'),g=read('docs/deployment-guide.md');
 for(const n of ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY','SITE_URL','STARTING_POINTS','REWARD_PLAN','REWARD_DAYS','UPLOADS_ENABLED','CF_D1_DATABASE_ID','CF_D1_DATABASE_NAME','CF_R2_BUCKET_NAME','BILLING_LIVE_ENABLED','BILLING_PUBLIC_CHECKOUT']){
  assert.match(ex,new RegExp('^'+n+'=$','m'),n+' is an empty placeholder');assert.ok(g.includes(n),n+' is explained in the guide')}
 for(const line of ex.split('\n').filter(l=>/^[A-Z_]+=/.test(l)))assert.match(line,/^[A-Z_0-9]+=$/,'no value in .env.example: '+line.split('=')[0]);
});
test('the guide covers host choice, accounts, env names, migrations and backup, email setup, DNS, Razorpay test and live, checklist and rollback',()=>{
 const g=read('docs/deployment-guide.md');
 for(const h of [/Recommended host and why/,/Accounts to create/,/Environment variables/,/Supabase setup/,/Database: create, migrate, back up/,/HTTPS, domain and DNS/,/Razorpay: test first, live separately/,/Launch checklist/,/Rollback plan/,/Honest limits/,/token_hash=\{\{ \.TokenHash \}\}&type=signup/,/token_hash=\{\{ \.TokenHash \}\}&type=recovery/,/0009/])assert.match(g,h);
 assert.match(g,/No DNS change was made|No deploy/);
});
test('nothing is enabled by default: reward, uploads, live billing and public checkout',()=>{
 const ex=read('.env.example');for(const n of ['REWARD_PLAN','REWARD_DAYS','UPLOADS_ENABLED','BILLING_LIVE_ENABLED','BILLING_PUBLIC_CHECKOUT'])assert.match(ex,new RegExp('^'+n+'=$','m'));
 assert.equal(fs.existsSync(path.join(root,'.env.local')),false);assert.equal(fs.existsSync(path.join(root,'.env')),false);
});
