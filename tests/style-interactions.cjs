const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs'),{missions}=h.load('lib/missions.ts'),{missionForLevel}=h.load('lib/mission-levels.ts');
const I=h.load('lib/style-interactions.ts'),{miniChallenge}=h.load('lib/play.ts'),{saveProfile}=h.load('lib/learning-service.ts'),{handleBridgeMessage}=h.load('lib/bridge/whatsapp-chat.ts');
const {applicationCard}=h.load('lib/application-bank.ts');
const letter=n=>String.fromCharCode(65+n),m=missionForLevel(missions.find(m=>m.id==='d1'),'beginner');
// These fixtures isolate style assessment; real semantic routing is exercised separately.
h.load('lib/ai-feedback.ts').interpretMentorMessage=async()=>({kind:'answer'});
let serial=0;
async function setup(style){h.reset({env:{OPENAI_API_KEY:'fake-style-provider'}});const user='interaction-'+style+'-'+(++serial),phone='919000000080',stamp=new Date().toISOString();await saveProfile(user,{goal:'job',track:'development',level:'beginner',language:'en',minutes:'15',style});h.db.prepare("INSERT INTO whatsapp_contacts(user_id,phone,state,language,verified_at,consent_at,updated_at) VALUES (?,?,'opted_in','en',?,?,?)").run(user,phone,stamp,stamp,stamp);return {user,send:text=>handleBridgeMessage({wamid:'style-flow-'+(++serial),from:phone,type:'text',text}),draft:()=>{const r=h.db.prepare('SELECT quiz,body FROM whatsapp_drafts WHERE user_id=?').get(user);return {...r,data:JSON.parse(r.body)}}};}
function provider(accepted){global.fetch=async(url,options)=>Response.json({choices:[{message:{content:JSON.stringify({accepted,feedback:accepted?'Server confirmation prevents false success.':'A click does not prove storage.',followUp:accepted?'':'What confirms the row was stored?'})}}]});}
function untouched(){for(const table of ['work','mission_scores','practice_events','ai_feedback_usage'])assert.equal(h.db.prepare('SELECT count(*) n FROM '+table).get().n,0,table);}
test('all 40 game modes require two distinct decisions and never clear after a wrong second answer',()=>{
 for(const base of missions){const mission=missionForLevel(base,'beginner');let turn=I.styleTurn(mission,I.initialStyleState('game'),letter(mission.answer));assert.equal(turn.state.stage,'checkpoint');assert.equal(turn.completed,undefined);const mini=applicationCard(mission);turn=I.styleTurn(mission,turn.state,letter((mini.answer+1)%mini.options.length));assert.equal(turn.state.stage,'checkpoint');assert.equal(turn.completed,undefined);turn=I.styleTurn(mission,turn.state,letter(mini.answer));assert.equal(turn.completed,true);}
});
test('Facts verifies a misconception before applying the rule; Casual and Story need checked explanation',()=>{
 let turn=I.styleTurn(m,I.initialStyleState('facts'),I.ruleIsTrue(m)?'FALSE':'TRUE');assert.equal(turn.state.stage,'rule');turn=I.styleTurn(m,turn.state,I.ruleIsTrue(m)?'TRUE':'FALSE');assert.equal(turn.state.stage,'apply');assert.equal(turn.completed,undefined);assert.equal(I.styleTurn(m,turn.state,letter(m.answer)).completed,true);
 for(const base of missions){const fact=I.styleTurn(base,I.initialStyleState('facts'),I.ruleIsTrue(base)?'TRUE':'FALSE');assert.equal(fact.state.stage,'apply');}
 const casual=I.styleTurn(m,I.initialStyleState('casual'),'Only after a confirmed server save.');assert.equal(casual.needsCheck,true);assert.equal(casual.completed,undefined);
 let story=I.styleTurn(m,I.initialStyleState('story'),letter((m.answer+1)%m.options.length));assert.match(story.reply,/Alternate ending/);assert.match(story.reply,/parent expects a trial slot/);assert.equal(story.state.stage,'branch');story=I.styleTurn(m,story.state,letter(I.storyBranchAnswer(m)));assert.equal(story.state.stage,'impact');story=I.styleTurn(m,story.state,letter(applicationCard(m).answer));assert.equal(story.state.stage,'explain');assert.equal(story.completed,undefined);assert.equal(I.styleTurn(m,story.state,'The server must confirm the stored booking.').needsCheck,true);
 assert.equal(I.checkedStyleTurn(story.state,{accepted:false,feedback:'Wrong reason.',followUp:'What proves storage?'}).completed,undefined);
 assert.equal(I.currentStyleState('facts',story.state).stage,'rule');
});
test('website interactions actually differ: open response, two checkpoints, story consequences and true/false',()=>{
 require.extensions['.tsx']=require.extensions['.ts'];const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),View=h.load('components/whatslearn/style-interaction.tsx').default;
 const render=style=>renderToStaticMarkup(React.createElement(View,{mission:m,style}));
 assert.match(render('casual'),/<textarea/);assert.doesNotMatch(render('casual'),/Send ASK|\*Question/);assert.doesNotMatch(render('casual'),/Your decision/);
 assert.match(render('game'),/CHECKPOINT 1\/2/);assert.doesNotMatch(render('game'),/<textarea/);
 assert.match(render('facts'),/TRUE OR FALSE/);assert.match(render('facts'),/>FALSE</);
 assert.match(render('story'),/CHOOSE → SEE THE CONSEQUENCE → EXPLAIN/);
});
test('WhatsApp game checkpoint state survives TODAY, rejects wrong transfer and keeps completion untouched',async()=>{
 const a=await setup('game');assert.match((await a.send('TODAY')).text,/CHECKPOINT 1\/2/);assert.match((await a.send(letter(m.answer))).text,/CHECKPOINT 2\/2/);assert.equal(a.draft().quiz,null);assert.match((await a.send('TODAY')).text,/CHECKPOINT 2\/2/);
 const mini=applicationCard(m);assert.match((await a.send(letter((mini.answer+1)%mini.options.length))).text,/stays open/);assert.equal(a.draft().quiz,null);const next=await a.send(letter(mini.answer));assert.match(next.text,/BUILD CHECKPOINT 1\//);assert.equal(a.draft().quiz,m.answer);untouched();
});
test('WhatsApp facts uses true/false then a separate application',async()=>{
 const a=await setup('facts');assert.match((await a.send('TODAY')).text,/TRUE OR FALSE/);await a.send(I.ruleIsTrue(m)?'FALSE':'TRUE');assert.equal(a.draft().data.styleState.stage,'rule');await a.send(I.ruleIsTrue(m)?'TRUE':'FALSE');assert.equal(a.draft().data.styleState.stage,'apply');assert.equal(a.draft().quiz,null);assert.match((await a.send(letter(m.answer))).text,/APPLY 1\//);assert.equal(a.draft().quiz,m.answer);untouched();
});
test('WhatsApp Casual evaluates the actual sentence, rejects weak reasoning and does not invent completion',async()=>{
 const a=await setup('casual');assert.match((await a.send('TODAY')).text,/Your take/);provider(false);assert.match((await a.send('The click itself means the booking is saved.')).text,/does not prove storage/);assert.equal(a.draft().quiz,null);provider(true);const next=await a.send('Only after the server confirms that the booking row is stored.');assert.match(next.text,/Server confirmation prevents false success/);assert.equal(a.draft().quiz,m.answer);untouched();
});
test('WhatsApp Story branches on the choice and checks its consequence before moving on',async()=>{
 const a=await setup('story');assert.match((await a.send('TODAY')).text,/YOUR MOVE/);assert.match((await a.send(letter((m.answer+1)%m.options.length))).text,/Alternate ending/);assert.match((await a.send(letter(I.storyBranchAnswer(m)))).text,/SCENE 3/);assert.match((await a.send(letter(applicationCard(m).answer))).text,/NEXT SCENE/);assert.equal(a.draft().quiz,null);provider(false);await a.send('It is safe because the parent clicked the button.');assert.equal(a.draft().data.styleState.stage,'explain');provider(true);await a.send('The server confirms storage so the parent is not misled by an attempted request.');assert.equal(a.draft().quiz,m.answer);untouched();
});
test('style explanation errors keep the same step; anonymous and cross-site calls are blocked',async()=>{
 const a=await setup('casual');await a.send('TODAY');h.env.OPENAI_API_KEY='';assert.match((await a.send('The server must confirm that the row was actually stored.')).text,/unavailable/);assert.equal(a.draft().quiz,null);untouched();
 const route=h.load('app/api/style-interaction/route.ts');assert.equal((await route.POST(h.req('/api/style-interaction',{body:{missionId:'d1',answer:'Server confirmation is required.'}}))).status,401);assert.equal((await route.POST(h.req('/api/style-interaction',{origin:'https://other.test',body:{missionId:'d1',answer:'Server confirmation is required.'}}))).status,403);
});
