const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {agencyStory,agencyTracks,agencyStoryLanguages,agencyTrackText}=require('../lib/agency-story.ts');

test('each subject has a different first question, choices, clue and feedback in every supported starter language',()=>{
 for(const language of agencyStoryLanguages){
  const starters=agencyTracks.map(track=>agencyStory(language,track.id));
  for(const key of ['question','clue','feedback'])assert.equal(new Set(starters.map(s=>s.copy[key])).size,4,`${language}: ${key} must follow the selected subject`);
  assert.equal(new Set(starters.map(s=>s.copy.options.join('|'))).size,4,`${language}: answer choices must differ`);
  for(const s of starters){assert.equal(s.contentLanguage,language);assert.equal(s.translated,true);assert.equal(s.copy.options.length,2);assert.equal(s.copy.tasks.length,4)}
 }
});

test('English subject starters match campaign, approval flow, character choice and visual sequence',()=>{
 assert.match(agencyStory('en','marketing').copy.options[0],/reach/);
 assert.match(agencyStory('en','development').copy.question,/approval/i);
 assert.match(agencyStory('en','filmmaking').copy.question,/film/i);
 assert.match(agencyStory('en','storytelling').copy.question,/frames/i);
 for(const track of agencyTracks)assert.ok(agencyTrackText(track.id).join(' ').includes(agencyStory('en',track.id).copy.question));
});

test('the hero passes the selected subject into its starter copy',()=>{
 assert.match(fs.readFileSync('components/whatslearn/visual-start.tsx','utf8'),/agencyStory\(language,track\)/);
});
