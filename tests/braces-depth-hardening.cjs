const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
let resolver=createRequire(fs.realpathSync('node_modules/vinext/package.json'));
for(const name of ['vite-plugin-commonjs','vite-plugin-dynamic-import','fast-glob','micromatch'])resolver=createRequire(resolver.resolve(name));
const entry=resolver.resolve('braces'),braces=resolver('braces'),guard=require(path.join(path.dirname(entry),'lib/assert-safe-ast.js'));
const bounded=e=>e instanceof SyntaxError&&/maximum nesting depth/.test(e.message)&&!/call stack/.test(e.message);
test('the dependency path used by the build loads the committed hardening patch',()=>{
 assert.equal(guard.MAX_DEPTH,128);
 assert.match(fs.readFileSync('pnpm-workspace.yaml','utf8'),/patchedDependencies:[\s\S]*braces@3.0.3/);
 assert.ok(fs.existsSync('patches/braces@3.0.3.patch'));
 assert.match(fs.readFileSync('.gitattributes','utf8'),/patches\/\*\.patch text eol=lf/);
});
test('normal brace and glob patterns retain their behaviour',()=>{
 assert.equal(braces.compile('{a,b}'),'(a|b)');
 assert.deepEqual(braces.expand('a{1..3}'),['a1','a2','a3']);
 assert.deepEqual(braces.expand('{a,{b,c}}'),['a','b','c']);
 assert.deepEqual(braces.expand('{src,test}/**/*.{js,ts}'),['src/**/*.js','src/**/*.ts','test/**/*.js','test/**/*.ts']);
 assert.equal(braces.stringify(braces.parse('a/{b,c}/d')),'a/{b,c}/d');
});
test('long literal and escaped patterns do not consume nesting depth',()=>{
 assert.doesNotThrow(()=>braces.compile('x'.repeat(5000)));
 assert.doesNotThrow(()=>braces.compile('\\{'.repeat(1500)));
 assert.doesNotThrow(()=>braces.compile('"'+'{'.repeat(2000)+'"'));
 assert.doesNotThrow(()=>braces.compile('{'.repeat(100)+'a'+'}'.repeat(100)));
});
for(const method of ['parse','compile','expand'])test(method+' rejects the reported deep string without stack exhaustion',()=>{
 const pattern='{'.repeat(4000)+'a'+'}'.repeat(4000);
 assert.throws(()=>braces[method](pattern),bounded);
 assert.throws(()=>braces[method](pattern,{maxLength:1000000,maxDepth:Infinity}),bounded);
});
function deepAst(){const root={type:'root',nodes:[]};let current=root;for(let i=0;i<5000;i++){const child={type:'brace',nodes:[]};current.nodes.push(child);current=child}return root;}
for(const method of ['compile','expand','stringify'])test(method+' also bounds a caller-supplied AST',()=>assert.throws(()=>braces[method](deepAst()),bounded));
test('the iterative preflight rejects cycles and oversized trees',()=>{
 const cyclic={type:'root',nodes:[]};cyclic.nodes.push(cyclic);
 assert.throws(()=>guard(cyclic),/Cyclic brace AST/);
 assert.throws(()=>guard({type:'root',nodes:Array.from({length:32769},()=>({type:'text',value:'a'}))}),/maximum AST nodes/);
});
test('shared leaf objects in an acyclic AST remain supported',()=>{
 const leaf={type:'text',value:'a'},root={type:'root',nodes:[leaf,leaf]};
 assert.doesNotThrow(()=>guard(root));assert.equal(braces.compile(root),'aa');
});
