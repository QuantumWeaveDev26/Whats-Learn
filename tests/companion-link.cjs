// The ChatGPT companion button opens exactly the WhatsLearn GPT link the owner gave. Run: node --test tests/companion-link.cjs
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const EXACT='https://chatgpt.com/g/g-683b056072048191a84d71e799ecbc26-whatslearn-from-chat-to-change';
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
test('companion link is exact, https, and is the only configured ChatGPT link',()=>{
 assert.equal(require('../lib/companion.ts').companionInstallUrl,EXACT);
 const url=new URL(EXACT);assert.equal(url.protocol,'https:');assert.equal(url.hostname,'chatgpt.com');
 const page=fs.readFileSync(path.resolve(__dirname,'../app/companion/page.tsx'),'utf8');
 assert.match(page,/href=\{companionInstallUrl\}/);assert.match(page,/Open WhatsLearn in ChatGPT/);
 assert.doesNotMatch(page,/chatgpt\.com\/g\//,'the page reads the link from lib/companion.ts, it has no second copy');
 // No other source file hard-codes a different ChatGPT GPT link.
 const hits=[];(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory()){if(!['node_modules','dist','.next','.vinext','.wrangler','.sites-runtime','tests'].includes(e.name))walk(p)}else if(/\.(ts|tsx|mjs|js)$/.test(e.name)&&/chatgpt\.com\/g\//.test(fs.readFileSync(p,'utf8')))hits.push(path.relative(path.resolve(__dirname,'..'),p))}})(path.resolve(__dirname,'..'));
 assert.deepEqual(hits,['lib/companion.ts']);
});
