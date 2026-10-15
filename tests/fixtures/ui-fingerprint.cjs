const fs=require('fs'),crypto=require('crypto'),path=require('path');const root=process.argv[2]||process.cwd();
const h=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);
function cls(f){const t=fs.readFileSync(path.join(root,f),'utf8');const set=new Set();for(const m of t.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g))set.add(m[1]??m[2]??m[3]);return h([...set].sort().join('\n'))}
function tags(f){const t=fs.readFileSync(path.join(root,f),'utf8');return h([...t.matchAll(/(?<![\w$])<([A-Za-z][\w.]*)/g)].map(m=>m[1]).sort().join(','))}
const css=[];(function walk(d){for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){const p=d+'/'+e.name;if(e.isDirectory()){if(!['node_modules','dist','.next','.vinext','.wrangler','.sites-runtime'].includes(e.name))walk(p)}else if(/\.css$/.test(e.name))css.push(p)}})('.');
const out={css:Object.fromEntries(css.sort().map(f=>[f,h(fs.readFileSync(path.join(root,f)))])),classes:{},tags:{}};
for(const f of ['app/learn/page.tsx','components/whatslearn/mini-challenge.tsx','components/whatslearn/practice-coach.tsx','components/whatslearn/practice-rewards.tsx']){out.classes[f]=cls(f);out.tags[f]=tags(f)}
const list=d=>fs.readdirSync(path.join(root,d)).sort();out.components=list('components/whatslearn').join(',');
out.pages=[];(function walk(d){for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){const p=d+'/'+e.name;if(e.isDirectory())walk(p);else if(/^page\.tsx$/.test(e.name))out.pages.push(p)}})('app');out.pages.sort();
module.exports=out;if(require.main===module)console.log(JSON.stringify(out,null,1));
