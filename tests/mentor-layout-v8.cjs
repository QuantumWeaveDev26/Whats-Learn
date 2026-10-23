const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const {renderToStaticMarkup}=require('react-dom/server');
const source=fs.readFileSync('app/companion/page.tsx','utf8');
async function page(mode){
 const exports={},module={exports};
 const customRequire=name=>{
  if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>mode==='guest'?null:{userId:'synthetic-layout-user'},chatGPTSignInPath:p=>'/signin?return_to='+encodeURIComponent(p)};
  if(name==='@/components/whatslearn/account-shell')return {default:({children})=>children};
  if(name==='@/lib/whatsapp')return {whatsappLinkReady:()=>true,getContact:async()=>{if(mode==='unavailable')throw Error('service down');return mode==='linked'?{verified_at:'2026-10-23T00:00:00Z',state:'opted_in'}:null}};
  if(name==='@/lib/contact')return {whatsappLearningUrl:()=> 'https://wa.me/19999999999?text=TODAY',whatsappLinkProps:{target:'_blank',rel:'noopener noreferrer'}};
  if(name==='@/lib/companion')return {companionInstallUrl:''};
  return require(name);
 };
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','exports','module',js)(customRequire,exports,module);
 return renderToStaticMarkup(await exports.default());
}
for(const mode of ['guest','unlinked','linked','unavailable'])test(mode+' learning options use balanced steps and retain safe destinations',async()=>{
 const html=await page(mode);
 assert.equal((html.match(/account-card learning-option-card/g)||[]).length,2);
 assert.equal((html.match(/<li/g)||[]).length,6);
 assert.equal((html.match(/class="primary"/g)||[]).length,2);
 assert.equal((html.match(/class="learning-option-note"/g)||[]).length,2);
 assert.match(html,/See My Creations/);assert.match(html,/Return to My Journey/);
 if(mode==='linked'){assert.match(html,/href="https:\/\/wa.me/);assert.match(html,/the link sends nothing automatically/)}
 else {assert.doesNotMatch(html,/href="https:\/\/wa.me/);assert.match(html,/settings/)}
 if(mode==='guest')assert.match(html,/Guest drafts stay on this device/);
 if(mode==='unavailable')assert.match(html,/role="status"/);
});
test('the mentor question box is available before the decision without changing completion gates',()=>{
 const s=fs.readFileSync('app/learn/workspace.tsx','utf8');
 const discover=s.slice(s.indexOf('{step===0?<><MissionOutcome'),s.indexOf('</>:step===1?'));
 assert.match(discover,/discover-mentor/);assert.match(discover,/<summary>Ask the mentor<\/summary><PracticeCoach/);
 assert.match(s,/async function save\(\)\{if\(!active\|\|quiz!==active.answer/);
 assert.match(s,/if\(guest\)\{setNotice\('Sign in for automatic evaluation/);
});
test('dashboard gives progress and next action priority over optional prose',()=>{
 const s=fs.readFileSync('app/learn/workspace.tsx','utf8'),css=fs.readFileSync('app/globals.css','utf8');
 assert.match(s,/Your next small win/);assert.match(s,/aria-label="Course progress"/);
 assert.match(s,/className="journey-tools"/);assert.match(s,/save-sync-note"><summary>Where my work is saved/);
 assert.match(css,/\.journey-tools \.website-tour-invitation p\{display:none\}/);
 assert.match(css,/grid-template-rows:subgrid/);
});
test('project mentoring uses the requested entrepreneur wording without outcome guarantees',()=>{
 const s=fs.readFileSync('components/whatslearn/project-support.tsx','utf8');
 assert.match(s,/Master your skills with experienced entrepreneurs\./);
 assert.match(s,/Explore project mentoring/);assert.match(s,/We’ll discuss scope and fees/);
 assert.doesNotMatch(s,/guaranteed|guarantee a job|verified entrepreneurs/i);
});
