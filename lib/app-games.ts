import {database} from './storage';
import {learnerName} from './learner-name';
import {games,type GameId} from '@/components/whatslearn-app/games-data';
/**
 * App games on the server: one best score per learner, game and week; a weekly tournament on one game;
 * and squads of up to five friends whose best tournament scores add up to a team score. Games never touch course points.
 */
export const SQUAD_MAX=5;
export const gameIds=games.map(g=>g.id) as GameId[];
/** Weeks run Monday to Sunday, India time. */
export function weekOf(now=new Date()){
 const day=Math.floor((now.getTime()+5.5*3600e3)/864e5);const monday=day-((new Date(day*864e5).getUTCDay()+6)%7);
 return {key:new Date(monday*864e5).toISOString().slice(0,10),index:Math.floor(monday/7),endsAt:new Date((monday+7)*864e5-5.5*3600e3).toISOString()};
}
export function tournamentGame(now=new Date()){const i=weekOf(now).index;return games[((i%games.length)+games.length)%games.length]}
const shortName=async(userId:string)=>{const n=((await learnerName(userId))||'').trim().split(/\s+/)[0]||'Learner';return n.slice(0,20)};

export async function recordScore(userId:string,game:GameId,score:number,now=new Date()){
 const week=weekOf(now).key,at=now.toISOString();
 await database().prepare('INSERT INTO game_scores (user_id,game,week,score,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id,game,week) DO UPDATE SET updated_at=CASE WHEN excluded.score>game_scores.score THEN excluded.updated_at ELSE game_scores.updated_at END, score=MAX(game_scores.score,excluded.score)').bind(userId,game,week,score,at).run();
 const best=await database().prepare('SELECT score FROM game_scores WHERE user_id=? AND game=? AND week=?').bind(userId,game,week).first<{score:number}>();
 return {week,best:Number(best?.score||score)};
}

async function squadOf(userId:string){return database().prepare('SELECT s.id,s.code,s.name,s.owner_id FROM game_squads s JOIN game_squad_members m ON m.squad_id=s.id WHERE m.user_id=?').bind(userId).first<{id:string;code:string;name:string;owner_id:string}>()}

/** Everything the Play tab shows: this week's game, the top players, the top squads and, when signed in, your own place. */
export async function weeklyBoard(userId?:string,now=new Date()){
 const w=weekOf(now),g=tournamentGame(now),db=database();
 const top=(await db.prepare('SELECT user_id,score FROM game_scores WHERE game=? AND week=? ORDER BY score DESC, updated_at ASC LIMIT 10').bind(g.id,w.key).all<{user_id:string;score:number}>()).results;
 const players=Number((await db.prepare('SELECT COUNT(*) n FROM game_scores WHERE game=? AND week=?').bind(g.id,w.key).first<{n:number}>())?.n||0);
 const squads=(await db.prepare('SELECT s.id,s.name,COUNT(m.user_id) members,COALESCE(SUM(gs.score),0) total FROM game_squads s JOIN game_squad_members m ON m.squad_id=s.id LEFT JOIN game_scores gs ON gs.user_id=m.user_id AND gs.game=? AND gs.week=? GROUP BY s.id ORDER BY total DESC, s.created_at ASC LIMIT 10').bind(g.id,w.key).all<{id:string;name:string;members:number;total:number}>()).results;
 const out={week:w.key,endsAt:w.endsAt,game:g.id,players,
  top:await Promise.all(top.map(async(r,i)=>({rank:i+1,name:await shortName(r.user_id),score:Number(r.score),me:r.user_id===userId}))),
  squads:squads.map((s,i)=>({rank:i+1,name:s.name,members:Number(s.members),total:Number(s.total)})),
  me:null as null|{score:number;rank:number},squad:null as null|{name:string;code:string;owner:boolean;total:number;rank:number;members:{name:string;score:number;me:boolean}[]}};
 if(!userId)return out;
 const mine=await db.prepare('SELECT score FROM game_scores WHERE user_id=? AND game=? AND week=?').bind(userId,g.id,w.key).first<{score:number}>();
 if(mine){const above=await db.prepare('SELECT COUNT(*) n FROM game_scores WHERE game=? AND week=? AND score>?').bind(g.id,w.key,mine.score).first<{n:number}>();out.me={score:Number(mine.score),rank:Number(above?.n||0)+1}}
 const sq=await squadOf(userId);
 if(sq){const members=(await db.prepare('SELECT m.user_id,COALESCE(gs.score,0) score FROM game_squad_members m LEFT JOIN game_scores gs ON gs.user_id=m.user_id AND gs.game=? AND gs.week=? WHERE m.squad_id=? ORDER BY score DESC, m.joined_at ASC').bind(g.id,w.key,sq.id).all<{user_id:string;score:number}>()).results;
  const total=members.reduce((n,m)=>n+Number(m.score),0);
  const ahead=await db.prepare('SELECT COUNT(*) n FROM (SELECT s.id,COALESCE(SUM(gs.score),0) t FROM game_squads s JOIN game_squad_members m ON m.squad_id=s.id LEFT JOIN game_scores gs ON gs.user_id=m.user_id AND gs.game=? AND gs.week=? GROUP BY s.id) WHERE t>?').bind(g.id,w.key,total).first<{n:number}>();
  out.squad={name:sq.name,code:sq.code,owner:sq.owner_id===userId,total,rank:Number(ahead?.n||0)+1,members:await Promise.all(members.map(async m=>({name:await shortName(m.user_id),score:Number(m.score),me:m.user_id===userId})))}}
 return out;
}

export class SquadError extends Error{constructor(message:string,public status=400){super(message)}}
const CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode=()=>{const b=new Uint8Array(6);crypto.getRandomValues(b);return [...b].map(x=>CODE_CHARS[x%CODE_CHARS.length]).join('')};
export const cleanSquadName=(v:string)=>v.replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,30);
export async function createSquad(userId:string,name:string,now=new Date()){
 const n=cleanSquadName(name);if(n.length<2)throw new SquadError('Give your squad a name of at least 2 letters.');
 if(await squadOf(userId))throw new SquadError('You are already in a squad. Leave it first to start a new one.',409);
 const id=crypto.randomUUID(),at=now.toISOString();
 for(let i=0;i<5;i++){const code=newCode();try{await database().prepare('INSERT INTO game_squads (id,code,name,owner_id,created_at) VALUES (?,?,?,?,?)').bind(id,code,n,userId,at).run();await database().prepare('INSERT INTO game_squad_members (squad_id,user_id,joined_at) VALUES (?,?,?)').bind(id,userId,at).run();return {code}}catch(e){if(!/UNIQUE/i.test(String(e))||i===4)throw e}}
 throw new SquadError('Could not create the squad. Please try again.',503);
}
export async function joinSquad(userId:string,code:string,now=new Date()){
 const c=code.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
 const sq=await database().prepare('SELECT id,name FROM game_squads WHERE code=?').bind(c).first<{id:string;name:string}>();if(!sq)throw new SquadError('No squad has that code. Check it with your friend.',404);
 const current=await squadOf(userId);if(current?.id===sq.id)return {name:sq.name};if(current)throw new SquadError('You are already in a squad. Leave it first to join another.',409);
 const n=await database().prepare('SELECT COUNT(*) n FROM game_squad_members WHERE squad_id=?').bind(sq.id).first<{n:number}>();if(Number(n?.n||0)>=SQUAD_MAX)throw new SquadError(`That squad is full (${SQUAD_MAX} friends).`,409);
 await database().prepare('INSERT INTO game_squad_members (squad_id,user_id,joined_at) VALUES (?,?,?)').bind(sq.id,userId,now.toISOString()).run();return {name:sq.name};
}
export async function leaveSquad(userId:string){
 const sq=await squadOf(userId);if(!sq)return;
 await database().prepare('DELETE FROM game_squad_members WHERE squad_id=? AND user_id=?').bind(sq.id,userId).run();
 const left=await database().prepare('SELECT user_id FROM game_squad_members WHERE squad_id=? ORDER BY joined_at ASC LIMIT 1').bind(sq.id).first<{user_id:string}>();
 if(!left)await database().prepare('DELETE FROM game_squads WHERE id=?').bind(sq.id).run();
 else if(sq.owner_id===userId)await database().prepare('UPDATE game_squads SET owner_id=? WHERE id=?').bind(left.user_id,sq.id).run();
}
