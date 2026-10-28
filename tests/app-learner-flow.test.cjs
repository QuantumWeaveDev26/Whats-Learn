const test=require('node:test'),assert=require('node:assert/strict');
const {hooks,load,find,all,text}=require('./helpers/client-components.cjs');
const h=hooks(),{missions}=load('lib/missions.ts',h),mission=missions.find(m=>m.id==='d1');
const snap={accountKey:'a',profile:{track:'marketing',level:'beginner'},work:[],paidAccess:false,checkpoints:[]};
function flow(data=new Map(),respond){const h=hooks(),requests=[],saved=[];const api={readLocal:k=>data.get(k)||null,writeLocal:(k,v)=>{data.set(k,v);return true},api:async(url,init)=>{requests.push({url,init});return respond?respond(url,init):{ok:true,data:{limit:3,used:0}}}};const {MissionFlow}=load('components/whatslearn-app/practice.tsx',h,{'./api':api});const render=()=>{h.start();return MissionFlow({accountKey:'a',mission,position:1,language:'en',onSaved:s=>saved.push(s),onUpgrade(){},onBack(){}})};return {h,data,requests,render,saved}}
test('the app exposes the actual runnable artifact and testing requirements before the quiz',()=>{
 const f=flow(),tree=f.render();assert.ok(text(tree).includes('local test server'),'show the real create step');assert.ok(text(tree).includes('forced failure'),'show the real test step');assert.ok(text(tree).includes('Share the code'),'show the required deliverable');
});
test('the knowledge check has a direct route back to the lesson',()=>{
 const f=flow();let tree=f.render();find(tree,n=>n.type==='button'&&text(n)==='Check my understanding').props.onClick();tree=f.render();const back=find(tree,n=>n.type==='button'&&text(n)==='Back to lesson');assert.ok(back);back.props.onClick();assert.ok(find(f.render(),n=>n.type==='button'&&text(n)==='Check my understanding'));
});
test('teaching examples do not call the points-deducting clue endpoint',async()=>{
 const f=flow();let tree=f.render();find(tree,n=>n.type==='button'&&text(n)==='Check my understanding').props.onClick();tree=f.render();find(tree,n=>n.type==='button'&&text(n)===mission.options[mission.answer]).props.onClick();tree=f.render();
 const example=find(tree,n=>n.type==='button'&&text(n).includes('Worked example'));assert.ok(example);await example.props.onClick();await f.h.flush();assert.equal(f.requests.filter(r=>r.url==='/api/clues').length,0);assert.ok(text(f.render()).includes('Illustration'));
});
test('incomplete work offers a direct next-part action rather than a disabled mystery button',()=>{
 const f=flow();let tree=f.render();find(tree,n=>n.type==='button'&&text(n)==='Check my understanding').props.onClick();tree=f.render();find(tree,n=>n.type==='button'&&text(n)===mission.options[mission.answer]).props.onClick();tree=f.render();
 const next=find(tree,n=>n.type==='button'&&text(n).includes('Go to next incomplete part'));assert.ok(next);assert.notEqual(next.props.disabled,true);assert.ok(all(tree,n=>n.props['aria-required']===true).length>0);
});
test('a restored draft retains its Make step and typed answer without making an AI request',async()=>{
 const f=flow();let tree=f.render();find(tree,n=>n.type==='button'&&text(n)==='Check my understanding').props.onClick();tree=f.render();find(tree,n=>n.type==='button'&&text(n)===mission.options[mission.answer]).props.onClick();tree=f.render();
 const input=find(tree,n=>n.props.id==='f-story');input.props.onChange({target:{value:'A parent requests a trial class.'}});f.render();await f.h.flush();
 const reopened=flow(f.data);tree=reopened.render();assert.ok(find(tree,n=>n.props.id==='f-story'));assert.equal(find(tree,n=>n.props.id==='f-story').props.value,'A parent requests a trial class.');assert.equal(reopened.requests.length,0);
});
test('restoring navigation never bypasses a plan gate, a prerequisite or account isolation',()=>{
 const {restoreResume,resumeRecord}=load('components/whatslearn-app/learning-state.ts');
 for(const id of ['m2','m4','unknown'])assert.equal(restoreResume(JSON.stringify({v:1,account:'a',tab:'practice',target:{kind:'mission',id}}),snap),null);
 assert.equal(restoreResume(JSON.stringify({v:1,account:'b',target:{kind:'mission',id:'d1'}}),snap),null);
 assert.equal(restoreResume(resumeRecord('a',{kind:'mission',mission,position:1},'practice'),snap).target.mission.id,'d1');
});
test('a saved creation shows its real feedback and next step without fabricating missing reviews',()=>{
 const h=hooks(),{Creations}=load('components/whatslearn-app/tabs.tsx',h),review={summary:'The failure state is clear.',strengths:[],checks:[],nextStep:'Compare the retry behaviour.'};
 const s={...snap,work:[{mission_id:'d1',body:'Saved private artifact',updated_at:'2026-10-28T10:00:00Z',evaluation:JSON.stringify(review)}]};
 h.start();const tree=Creations({s,view:'d1',setView(){},onBack(){},onImprove(){}});assert.ok(text(tree).includes(review.summary));assert.ok(text(tree).includes(review.nextStep));
 h.start();const noReview=Creations({s:{...s,work:[{...s.work[0],evaluation:null}]},view:'d1',setView(){},onBack(){},onImprove(){}});assert.ok(text(noReview).includes('No saved feedback'));assert.ok(!text(noReview).includes(review.summary));
});
test('course expansion is labelled View course and does not pretend to start practice',()=>{
 const h=hooks(),{Courses}=load('components/whatslearn-app/tabs.tsx',h);h.start();const tree=Courses({s:null,onOpen(){},onSignIn(){}});assert.ok(all(tree,n=>n.type==='button'&&text(n).includes('View course')).length===4);
});
test('improving saved work restores its structured evidence rather than asking for it again',()=>{
 const {answerBody,restoreDraft}=load('components/whatslearn-app/learning-state.ts'),{emptyAnswer,composeAnswer,parseAnswer}=load('lib/practical.ts');
 const answer={...emptyAnswer(),reasoning:'I wait for confirmed storage so parents never see an invented success message.'};
 const evidence={artifact:'async function hold(){ await save(); showSaved(); }',test:'I ran a success and a forced failure locally.',result:'Success appeared after save; failure showed Retry.',improvement:'I moved the success message after the awaited save.'};
 const saved=composeAnswer(mission.practical,{...answer,reasoning:answerBody(answer,evidence)});
 const restored=restoreDraft(null,mission,'en',parseAnswer(mission.practical,saved));assert.deepEqual(restored.evidence,evidence);assert.equal(restored.answer.reasoning,answer.reasoning);
});
test('editing is disabled while a submitted version is being saved',async()=>{
 const {answerBody}=load('components/whatslearn-app/learning-state.ts'),{composeAnswer}=load('lib/practical.ts');
 const answer={fields:Object.fromEntries(mission.practical.fields.map(f=>[f.id,f.type==='choice'?f.options[0]:'A sufficiently detailed answer for this field.'])),reasoning:'I wait for storage confirmation to keep the parent informed accurately.',link:''};
 const evidence={artifact:'async function hold(){await save(); showSaved()}',test:'Ran success and forced failure.',result:'Failure displayed Retry without success.',improvement:'Moved success after the awaited save.'};
 const review={summary:'Synthetic test feedback.',strengths:[],checks:[],nextStep:'Ready for the save check.'},body=composeAnswer(mission.practical,{...answer,reasoning:answerBody(answer,evidence)});
 const data=new Map([['wla-draft:a:d1',JSON.stringify({v:2,answer,evidence,step:'review',part:2,quiz:mission.answer,language:'en',level:'practising',checks:[],review,reviewBody:body})]]);let resolve;
 const f=flow(data,(url,init)=>url==='/api/work'?new Promise(r=>resolve=r):Promise.resolve({ok:true,data:{limit:3,used:0}}));let tree=f.render();const pending=find(tree,n=>n.type==='button'&&text(n)==='Save my task').props.onClick();tree=f.render();
 const edit=find(tree,n=>n.type==='button'&&text(n)==='Improve it first');assert.equal(edit.props.disabled,true);
 resolve({ok:true,data:{saved:true,review,award:{status:'saved',message:'Synthetic save'}}});await pending;assert.equal(f.saved.length,1);
});
test('the course row supports mouse dragging and prevents a drag from opening a course',()=>{
 const h=hooks(),{Home}=load('components/whatslearn-app/tabs.tsx',h);h.start();let opened=0;const tree=Home({s:{...snap,name:'Test',profile:{...snap.profile,minutes:'15'},points:null},onOpen(){},onTab(){},onCourse(){opened++}});
 const row=find(tree,n=>n.props.className?.split(' ').includes('wla-carousel'));assert.equal(typeof row.props.onPointerDown,'function');
 const captured=new Set(),el={scrollLeft:100,setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)};
 row.props.onPointerDown({button:0,pointerType:'mouse',pointerId:1,clientX:150,clientY:50,currentTarget:el});row.props.onPointerMove({pointerId:1,clientX:80,clientY:52,currentTarget:el,preventDefault(){}});assert.equal(el.scrollLeft,170);
 row.props.onPointerUp({pointerId:1,currentTarget:el});let blocked=false;row.props.onClickCapture({detail:1,preventDefault(){blocked=true},stopPropagation(){}});assert.equal(blocked,true);assert.equal(opened,0);
 row.props.onPointerDown({button:0,pointerType:'mouse',pointerId:2,clientX:150,clientY:50,currentTarget:el});let tapBlocked=false;row.props.onClickCapture({detail:1,preventDefault(){tapBlocked=true},stopPropagation(){}});assert.equal(tapBlocked,false);
});
