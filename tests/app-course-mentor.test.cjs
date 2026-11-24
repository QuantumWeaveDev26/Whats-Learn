const test=require('node:test'),assert=require('node:assert/strict');
const {hooks,load,find,all,text}=require('./helpers/client-components.cjs');
test('retrying an unanswered mentor question keeps one copy in the conversation',async()=>{
 const h=hooks(),sent=[];
 const api=async(_url,init)=>{sent.push(init.body.question);return sent.length===1
  ?{ok:false,status:0,data:{error:'Connection lost'}}
  :{ok:true,status:200,data:{answer:'Start with one concrete benefit.'}}};
 const {Mentor}=load('components/whatslearn-app/tabs.tsx',h,{'./api':{api,currentAccount:()=>'',readLocal:()=>null,writeLocal:()=>true}});
 const render=()=>{h.start();return Mentor({missionId:'m1',language:'en',signedIn:true})};
 const question='Explain this task simply';
 await find(render(),n=>n.type==='button'&&text(n)===question).props.onClick();
 await find(render(),n=>n.type==='button'&&text(n)==='Retry question').props.onClick();
 const screen=render();
 assert.deepEqual(sent,[question,question]);
 assert.equal(all(screen,n=>n.type==='p'&&text(n)===question).length,1);
 assert.match(text(screen),/Start with one concrete benefit/);
 assert.doesNotMatch(text(screen),/Retry question/);
});
test('each course mentor sends the selected task and language with a bounded wait',async()=>{
 for(const missionId of ['m1','d1','f1','s1']){
  const h=hooks(),requests=[];
  const {Mentor}=load('components/whatslearn-app/tabs.tsx',h,{'./api':{currentAccount:()=>'',readLocal:()=>null,writeLocal:()=>true,api:async(url,init)=>{requests.push({url,init});return {ok:false,data:{error:'Check your connection and try again.'}}}}});
  const render=()=>{h.start();return Mentor({missionId,language:'en',signedIn:true})};
  const idea=find(render(),n=>n.type==='button'&&text(n)==='Explain this task simply');await idea.props.onClick();
  assert.equal(requests[0].init.body.missionId,missionId);assert.equal(requests[0].init.body.language,'en');assert.ok(requests[0].init.timeoutMs>0);
  assert.match(text(render()),/Check your connection/);
 }
});
function courses(){const h=hooks(),{Courses}=load('components/whatslearn-app/tabs.tsx',h);return {render(){h.start();return Courses({s:null,onOpen(){},onSignIn(){}})}}}
test('a course opens its own task screen and Back returns to the four-course catalogue',()=>{const m=courses();let tree=m.render();assert.equal(all(tree,n=>n.type==='button'&&text(n).includes('View tasks')).length,4);find(tree,n=>n.type==='button'&&text(n).includes('AI Full-Stack Development')).props.onClick();tree=m.render();assert.ok(find(tree,n=>n.type==='button'&&text(n)==='Back to courses'));assert.ok(text(tree).includes('Build a trial-class booking page'));assert.ok(!text(tree).includes('A complete campaign for a local business'));find(tree,n=>n.type==='button'&&text(n)==='Back to courses').props.onClick();assert.equal(all(m.render(),n=>n.type==='button'&&text(n).includes('View tasks')).length,4)});
test('Mentor has a separate bottom composer with an optional mic and keeps manual Send',()=>{const h=hooks(),{Mentor}=load('components/whatslearn-app/tabs.tsx',h);h.start();const tree=Mentor({missionId:'m1',language:'en',signedIn:true});const composer=find(tree,n=>n.props.className==='wla-mentor-compose');assert.ok(composer);assert.ok(find(composer,n=>n.type==='button'&&n.props['aria-label']?.includes('Dictate')));assert.equal(find(composer,n=>n.type==='button'&&n.props['aria-label']==='Send').props.disabled,true)});

function dictation(host={}){const h=hooks();let value='My question';const prior=global.window;global.window=host;const {useDictation}=load('components/whatslearn-app/dictation.ts',h);const render=()=>{h.start();return useDictation({language:'hi',value,onChange:v=>value=v})};return {h,render,value:()=>value,restore(){h.unmount();global.window=prior}}}
function speechHost(){const sessions=[];class Speech{constructor(){sessions.push(this)}start(){this.started=true}stop(){this.stopped=true;this.onend?.()}abort(){this.aborted=true}}return {sessions,host:{webkitSpeechRecognition:Speech}}}
test('unsupported dictation keeps the typed question and offers a keyboard fallback',()=>{const m=dictation();try{m.render().toggle();assert.match(m.render().message,/not available|not supported|keyboard/i);assert.equal(m.value(),'My question')}finally{m.restore()}});
test('dictation starts only on tap, appends final speech once and never sends a question',async()=>{const {sessions,host}=speechHost(),m=dictation(host);try{m.render();await m.h.flush();assert.equal(sessions.length,0);m.render().toggle();const s=sessions[0];assert.equal(s.started,true);assert.match(s.lang,/hi/);s.onresult({results:[{isFinal:true,0:{transcript:'about this task'}}]});assert.equal(m.value(),'My question about this task');s.onresult({results:[{isFinal:true,0:{transcript:'about this task'}}]});assert.equal(m.value(),'My question about this task');s.onend();assert.equal(m.render().listening,false);assert.ok(m.value().includes('about this task'))}finally{m.restore()}});
test('permission rejection preserves input and stops the listening state',async()=>{const {sessions,host}=speechHost(),m=dictation(host);try{m.render();await m.h.flush();m.render().toggle();sessions[0].onerror({error:'not-allowed'});assert.equal(m.render().listening,false);assert.match(m.render().message,/permission|blocked/i);assert.equal(m.value(),'My question')}finally{m.restore()}});
test('dictation cleans up the microphone session when the mentor screen unmounts',async()=>{const {sessions,host}=speechHost(),m=dictation(host);try{m.render();await m.h.flush();m.render().toggle();m.h.unmount();assert.equal(sessions[0].aborted,true);assert.equal(sessions[0].onresult,null)}finally{m.restore()}});
