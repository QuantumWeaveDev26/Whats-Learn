const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const drafts=require('../lib/mission-drafts.ts'),data=new Map();global.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
test('account drafts cannot leak into another learner or guest session',()=>{
 data.clear();drafts.saveMissionDraft('f1','Learner A private draft','account:a');
 assert.equal(drafts.readMissionDraft('f1','account:a'),'Learner A private draft');
 assert.equal(drafts.readMissionDraft('f1','account:b'),null);assert.equal(drafts.readMissionDraft('f1'),null);
 drafts.saveMissionDraft('f1','Guest draft');drafts.saveMissionDraft('f1','Learner B draft','account:b');
 assert.equal(drafts.readMissionDraft('f1','account:a'),'Learner A private draft');
 drafts.clearMissionDraft('f1','account:a');assert.equal(drafts.readMissionDraft('f1','account:a'),null);
 assert.equal(drafts.readMissionDraft('f1','account:b'),'Learner B draft');assert.equal(drafts.readMissionDraft('f1'),'Guest draft');
});
test('legacy device drafts stay available only to guests and storage failures keep the editor safe',()=>{
 data.clear();data.set('whatslearn-mission-drafts-v1',JSON.stringify({m1:{body:'Old device writing',updated_at:'2026-10-16'}}));
 assert.equal(drafts.readMissionDraft('m1'),'Old device writing');assert.equal(drafts.readMissionDraft('m1','account:a'),null);
 global.localStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 assert.equal(drafts.readMissionDraft('m1','account:a'),null);assert.doesNotThrow(()=>drafts.saveMissionDraft('m1','Still in editor','account:a'));
});

test('explicit guest recovery moves only nonconflicting drafts to the current account, with no completion data',()=>{
 data.clear();global.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 drafts.saveMissionDraft('m1@beginner','Guest marketing creation');drafts.saveMissionDraft('d1','Guest booking creation');drafts.saveMissionDraft('d1','Existing account booking','account:a');
 const r=drafts.importGuestMissionDrafts('account:a');assert.deepEqual(r.keys,['m1@beginner']);assert.deepEqual(r.conflicts,['d1']);assert.equal(drafts.readMissionDraft('m1@beginner','account:a'),'Guest marketing creation');assert.equal(drafts.readMissionDraft('m1@beginner','account:b'),null);assert.equal(drafts.readMissionDraft('m1@beginner'),null);assert.equal(drafts.readMissionDraft('d1'),'Guest booking creation');assert.equal(drafts.readMissionDraft('d1','account:a'),'Existing account booking');assert.throws(()=>drafts.importGuestMissionDrafts('guest'));
});
test('a failed device write never removes the guest source',()=>{
 data.clear();global.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};drafts.saveMissionDraft('m1','Keep this guest writing');
 global.localStorage={getItem:k=>data.get(k)||null,setItem(){throw Error('storage blocked')}};assert.throws(()=>drafts.importGuestMissionDrafts('account:a'));assert.equal(drafts.readMissionDraft('m1'),'Keep this guest writing');
});
