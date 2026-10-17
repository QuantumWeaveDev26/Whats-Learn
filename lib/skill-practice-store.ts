import {database} from './storage';
import type {SkillPracticeRecord} from './skill-practice';
export async function loadSkillPractice(userId:string):Promise<SkillPracticeRecord[]>{
 const rows=await database().prepare('SELECT task_key,mission_id,skill,answer,accepted,attempts,mistakes,feedback,follow_up,created_at FROM skill_practice WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(userId).all();
 return rows.results.map(r=>({...r,accepted:Number(r.accepted)===1})) as unknown as SkillPracticeRecord[];
}
