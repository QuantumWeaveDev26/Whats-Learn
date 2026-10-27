const test=require('node:test'),assert=require('node:assert/strict'),h=require('./helpers/harness.cjs');
const {learningSummary}=h.load('lib/quality/learning-summary.ts');
test('first saves exclude existing learners and repeat practice requires distinct days',async()=>{
 h.reset();
 const insert=h.db.prepare('INSERT INTO mission_scores(user_id,mission_id,day,understanding,practical,clues,deduction,points,created_at) VALUES(?,?,?,1,1,0,0,1,?)');
 for(const [user,mission,day] of [['old','m1','2026-09-01'],['old','m2','2026-10-26'],['new','m1','2026-10-25'],['new','m2','2026-10-26']])insert.run(user,mission,day,day+'T12:00:00.000Z');
 assert.deepEqual(await learningSummary(new Date('2026-10-27T12:00:00.000Z')),{windowDays:30,firstSaved:1,active:2,repeatPractice:1});
});
