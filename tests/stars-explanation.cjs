const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const h=require('./helpers/harness.cjs');
const {practiceRewards}=h.load('lib/play.ts'),{missions}=h.load('lib/missions.ts'),{checkWriting}=h.load('lib/writing-check.ts'),{answerText}=h.load('lib/submission.ts');
test('stars use writing thresholds plus a unique revision, never self-review checkboxes',()=>{
 const m=missions.find(m=>m.id==='m1'),stamp='2026-10-17T08:00:00Z';
 for(const body of ['A saved short creation.',require('./fixtures/course-samples.json').m1]){
  const w={mission_id:m.id,body,quiz:m.answer,checks:Array(5).fill(false),updated_at:stamp};
  const score=checkWriting(m.id,answerText(m,body)).score;
  const before=practiceRewards([w],[],m.track).stars(m.id);
  assert.equal(before,1+Number(score>=60)+Number(score>=80));
  assert.equal(practiceRewards([{...w,checks:Array(5).fill(true)}],[],m.track).stars(m.id),before);
  const event={event_id:'revision:m1',mission_id:'m1',kind:'revision',created_at:stamp};
  assert.equal(practiceRewards([w],[event,event],m.track).stars(m.id),1+Number(score>=60)+1);
 }
 const copy=fs.readFileSync('components/whatslearn/practice-rewards.tsx','utf8');
 assert.match(copy,/60\/100/);assert.match(copy,/80\/100/);assert.match(copy,/Self-review checkboxes do not award stars/);assert.match(copy,/heuristic, not an AI assessment/);
});
