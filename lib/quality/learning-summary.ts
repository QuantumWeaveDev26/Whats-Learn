import {database} from '@/lib/storage';
/** Aggregate saved task receipts only; these are practice counts, not page visits. */
export async function learningSummary(at=new Date()){
 const since=new Date(at.getTime()-30*864e5).toISOString(),db=database();
 const [first,active,repeat]=await Promise.all([
  db.prepare('SELECT COUNT(*) n FROM (SELECT user_id,MIN(created_at) first_saved FROM mission_scores GROUP BY user_id) starts WHERE first_saved>=?').bind(since).first<{n:number}>(),
  db.prepare('SELECT COUNT(DISTINCT user_id) n FROM mission_scores WHERE created_at>=?').bind(since).first<{n:number}>(),
  db.prepare('SELECT COUNT(*) n FROM (SELECT user_id FROM mission_scores WHERE created_at>=? GROUP BY user_id HAVING COUNT(DISTINCT day)>=2) returning_learners').bind(since).first<{n:number}>()
 ]);
 return {windowDays:30,firstSaved:Number(first?.n||0),active:Number(active?.n||0),repeatPractice:Number(repeat?.n||0)};
}
