const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const manifest=JSON.parse(fs.readFileSync('package.json','utf8'));
for(const [name,minimum] of [['next','16.4.1'],['react','19.2.8'],['react-dom','19.2.8'],['react-server-dom-webpack','19.2.8'],['vite','8.1.6']])test(name+' installs the reviewed security patch version',()=>{
 const pin=manifest.dependencies[name]||manifest.devDependencies[name];
 assert.match(pin,/^\d+\.\d+\.\d+$/);
 const actual=require(name+'/package.json').version;assert.equal(actual,pin);
 const a=actual.split('.').map(Number),b=minimum.split('.').map(Number);assert.ok(a[0]>b[0]||a[0]===b[0]&&(a[1]>b[1]||a[1]===b[1]&&a[2]>=b[2]));
});
test('transitive patch floors retain install policies and do not suppress advisories',()=>{
 const policy=fs.readFileSync('pnpm-workspace.yaml','utf8');assert.match(policy,/minimumReleaseAge: 10080/);assert.match(policy,/strictDepBuilds: true/);
 assert.match(policy,/miniflare>sharp: 0.35.5/);assert.match(policy,/undici@>=7.0.0 <7.29.1/);
 assert.doesNotMatch(policy,/audit\.ignore|ignoreCves|ignore-cves/);
 const workflow=fs.readFileSync('.github/workflows/mentor-regression.yml','utf8');assert.match(workflow,/pnpm audit --prod --audit-level high/);assert.match(workflow,/pnpm audit --audit-level critical/);
});
