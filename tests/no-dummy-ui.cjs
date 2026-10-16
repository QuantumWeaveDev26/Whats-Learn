const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('learner screens have no feedback demo, future contest card or unused pilot dialog',()=>{
 assert.doesNotMatch(read('components/whatslearn/practice-coach.tsx'),/FEEDBACK DEMO|Show my next improvement/);
 assert.match(read('components/whatslearn/practice-coach.tsx'),/Review my practical work/);
 assert.doesNotMatch(read('app/learn/workspace.tsx'),/Team contests are coming later|In preparation|pilot membership|setInfo/);
 assert.doesNotMatch(read('components/whatslearn/membership.tsx'),/Save my plan preference|payment-preview|PAYMENT OPTIONS/);
 assert.match(read('components/whatslearn/membership.tsx'),/<RazorpayCheckout/);
 assert.match(read('components/whatslearn/reward-claim.tsx'),/s\?\.enabled&&/);
});
test('learner buttons have actions and links have real destinations',()=>{
 const errors=[];
 for(const dir of ['app','components/whatslearn'])for(const f of fs.readdirSync(path.join(root,dir),{recursive:true}).filter(f=>f.endsWith('.tsx'))){
  const full=path.join(dir,f);if(/studio\.tsx|research-content\.tsx/.test(full))continue;
  const s=ts.createSourceFile(full,read(full),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function visit(n){if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)){
   const tag=n.tagName.getText(s),attr=name=>n.attributes.properties.find(a=>a.name?.getText(s)===name);
   if(tag==='a') {const h=attr('href');if(!h||h.initializer&&ts.isStringLiteral(h.initializer)&&['','#','javascript:void(0)'].includes(h.initializer.text))errors.push(full+': empty href')}
   if(tag==='button'){
    const type=attr('type')?.initializer;const formAction=type&&ts.isStringLiteral(type)&&['submit','reset'].includes(type.text);const parent=n.parent?.parent;const delegated=parent&&ts.isJsxElement(parent)&&['DialogTrigger','DialogClose'].includes(parent.openingElement.tagName.getText(s));if(!attr('onClick')&&!formAction&&!delegated&&!attr('onPointerDown'))errors.push(full+': button without action');
    const click=attr('onClick')?.initializer?.expression;
    if(click&&ts.isArrowFunction(click)&&ts.isBlock(click.body)&&click.body.statements.length===0)errors.push(full+': empty click handler');
   }
  }ts.forEachChild(n,visit)}visit(s);
 }
 assert.deepEqual(errors,[]);
});
