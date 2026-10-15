import {env} from 'cloudflare:workers';
import {database} from './storage';
import {POINTS} from './mission-score';
/**
 * The learner's points balance for signed-in accounts, kept on the server as a ledger (table point_ledger). The balance is the sum of the learner's rows. Rows are never edited.
 *   starting   one row per account, ever: the starting balance (setting STARTING_POINTS)
 *   mission    one row per completed mission: the points it earned, after any clue cost
 *   clue       one row per clue revealed: minus its cost (a clue costs 5 points; the most one mission can cost is 10, so a third clue costs nothing)
 * The unique index on (user, kind, ref) is what stops double grants and double charges: a repeat, refresh, retry or second tab hits the index and changes nothing.
 * A clue charge is refused when the balance could not cover it, so the balance can never go below zero. Guests have no server balance.
 */
export const DEFAULT_STARTING_POINTS=50;
export function startingPoints():number{
 const raw=(env as unknown as Record<string,string|undefined>).STARTING_POINTS;
 if(raw===undefined||String(raw).trim()==='')return DEFAULT_STARTING_POINTS;
 const n=Number(raw);return Number.isInteger(n)&&n>=0&&n<=10000?n:DEFAULT_STARTING_POINTS;
}
export type LedgerRow={kind:'starting'|'mission'|'clue'|'welcome_seen';ref:string;delta:number;created_at:string};
/** Grants the starting balance exactly once for this account. Safe to call on every request. */
export async function ensureAccount(userId:string,now=new Date()){
 const r=await database().prepare("INSERT OR IGNORE INTO point_ledger (user_id,kind,ref,delta,created_at) VALUES (?,'starting','start',?,?)").bind(userId,startingPoints(),now.toISOString()).run();
 return (r.meta?.changes||0)>0;
}
/**
 * The one-time welcome message. `show` is true from the moment the starting balance is granted until the learner's browser confirms it showed the message
 * (a zero-point ledger row of kind 'welcome_seen'). An account whose welcome was erased by deletion (starting row of 0 points) never shows it.
 */
export async function welcomeStatus(userId:string){
 const r=await database().prepare("SELECT delta,created_at,(SELECT COUNT(*) FROM point_ledger WHERE user_id=? AND kind='welcome_seen') seen FROM point_ledger WHERE user_id=? AND kind='starting' AND ref='start'").bind(userId,userId).first() as {delta:number;created_at:string;seen:number}|null;
 const amount=Number(r?.delta||0);return {amount,grantedAt:r?.created_at||null,show:!!r&&amount>0&&!Number(r.seen)};
}
export async function markWelcomeSeen(userId:string,now=new Date()){
 await database().prepare("INSERT OR IGNORE INTO point_ledger (user_id,kind,ref,delta,created_at) SELECT ?,'welcome_seen','seen',0,? WHERE EXISTS (SELECT 1 FROM point_ledger WHERE user_id=? AND kind='starting' AND delta>0)").bind(userId,now.toISOString(),userId).run();
}
export async function pointsBalance(userId:string){
 const r=await database().prepare('SELECT COALESCE(SUM(delta),0) b FROM point_ledger WHERE user_id=?').bind(userId).first() as {b:number}|null;return Number(r?.b||0);
}
export async function pointsHistory(userId:string,limit=25):Promise<LedgerRow[]>{
 const rows=await database().prepare("SELECT kind,ref,delta,created_at FROM point_ledger WHERE user_id=? AND kind<>'welcome_seen' ORDER BY id DESC LIMIT ?").bind(userId,limit).all();
 return rows.results.map(r=>({kind:String(r.kind) as LedgerRow['kind'],ref:String(r.ref),delta:Number(r.delta),created_at:String(r.created_at)}));
}
/** SQL used by the clue charge: the cost of the next clue given how many a mission already has, never more than the cap. */
export const clueCostSql=`(MIN(${POINTS.clueCap},${POINTS.clue}*((SELECT COUNT(*) FROM mission_clues WHERE user_id=? AND mission_id=?)+1))-MIN(${POINTS.clueCap},${POINTS.clue}*(SELECT COUNT(*) FROM mission_clues WHERE user_id=? AND mission_id=?)))`;
