const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
let resolver=createRequire(fs.realpathSync('node_modules/vinext/package.json'));
for(const name of ['vite-plugin-commonjs','vite-plugin-dynamic-import'])resolver=createRequire(resolver.resolve(name));
const entry=resolver.resolve('fast-glob'),glob=resolver('fast-glob'),own=createRequire(entry),pattern=own('./utils/pattern.js'),expand=own('./utils/bounded-expansion.js');

test('the installed build chain no longer depends on braces or micromatch',()=>{
 for(const name of ['braces','micromatch'])assert.throws(()=>own.resolve(name),{code:'MODULE_NOT_FOUND'});
 const lock=fs.readFileSync('pnpm-lock.yaml','utf8');assert.doesNotMatch(lock,/^  (?:braces|micromatch)@/m);
 assert.equal(own('brace-expansion/package.json').version,'5.0.12');assert.equal(own('picomatch/package.json').version,'2.3.2');
 assert.match(fs.readFileSync('pnpm-workspace.yaml','utf8'),/fast-glob@3.3.3>micromatch/);
 assert.doesNotMatch(fs.readFileSync(path.join(path.dirname(entry),'utils/pattern.js'),'utf8'),/require\(["']micromatch/);
});

const before=JSON.parse(fs.readFileSync('tests/fixtures/glob-expansion-compat.json'));
for(const fixture of before)test('preserves expansion: '+fixture.pattern,()=>{
 assert.deepEqual(pattern.expandBraceExpansion(fixture.pattern),fixture.expanded.filter(x=>x!=='').sort((a,b)=>a.length-b.length));
});

test('deep nesting and mixed closing symbols cannot exhaust the stack',()=>{
 for(const value of ['{'.repeat(4000)+'a,b'+'}'.repeat(4000),'{)'.repeat(200)+'a,b'+'}'.repeat(200),'('.repeat(4000)+'a'+')'.repeat(4000)])
  assert.throws(()=>expand(value),e=>e instanceof SyntaxError&&/nesting depth/.test(e.message));
});
test('large ranges and combinatorial expansions fail instead of silently missing files',()=>{
 for(const value of ['{1..999999999}','{a,b}'.repeat(30)])assert.throws(()=>expand(value),/maximum expansions/);
});
test('input length and NUL bytes are bounded before parsing',()=>{
 assert.throws(()=>expand('x'.repeat(10001)),/safe input limits/);assert.throws(()=>expand('a\0b'),/safe input limits/);
});

const fixturesRoot=path.resolve('.sites-runtime'),fixtureRoot=fs.mkdtempSync(path.join(fixturesRoot,'glob-fixture-'));
const files=['src/a.ts','src/b.js','src/.hidden.ts','src/name[1].ts','test/a.ts','test/c.spec.ts','docs/readme.md'];
for(const file of files){const full=path.join(fixtureRoot,file);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,'// fixture');}
const options={cwd:fixtureRoot},source=['src/a.ts','src/b.js','src/name[1].ts','test/a.ts','test/c.spec.ts'].sort();
test.after(()=>{const resolved=path.resolve(fixtureRoot);assert.ok(resolved.startsWith(fixturesRoot+path.sep+'glob-fixture-'));fs.rmSync(resolved,{recursive:true,force:true});});
test('sync and async scanning retain brace, extension, negative and dot-file matching',async()=>{
 assert.deepEqual(glob.sync('{src,test}/**/*.{js,ts}',options).sort(),source);
 assert.deepEqual((await glob('{src,test}/**/*.{js,ts}',options)).sort(),source);
 assert.deepEqual(glob.sync(['{src,test}/**/*.ts','!**/*.spec.ts'],options).sort(),['src/a.ts','src/name[1].ts','test/a.ts']);
 assert.ok(glob.sync('src/*.ts',{...options,dot:true}).includes('src/.hidden.ts'));
 assert.deepEqual(glob.sync('{src,test}/name\\[1\\].ts',options),['src/name[1].ts']);
});
test('streaming and extglob matching retain the same source files',async()=>{
 const values=[];for await(const value of glob.stream('{src,test}/**/*.{js,ts}',options))values.push(value);
 assert.deepEqual(values.sort(),source);assert.deepEqual(glob.sync('src/*.@(js|ts)',options).sort(),source.filter(x=>x.startsWith('src/')));
});
test('both lint and framework consumers resolve the same patched implementation',()=>{
 const root=createRequire(fs.realpathSync('node_modules/eslint-config-next/package.json'));const plugin=createRequire(root.resolve('@next/eslint-plugin-next'));
 assert.equal(plugin.resolve('fast-glob'),entry);assert.ok(glob.generateTasks('{src,test}/**/*.{js,ts}').length>0);
});
