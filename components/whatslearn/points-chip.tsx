'use client';
export type PointsState='loading'|'ok'|'error'|'guest';
/**
 * The always-visible points balance. It never shows a number it does not have: while loading it says so, and if the balance cannot be loaded it says that and offers a retry.
 * Signed-in numbers come from the server. A guest sees local-only points, clearly labelled, and no welcome credit.
 */
export default function PointsChip({state,balance,guestPoints=0,onRetry}:{state:PointsState;balance?:number;guestPoints?:number;onRetry:()=>void}){
 return <div className={`points-chip points-chip-${state}`} role="status" aria-live="polite" aria-label="Points balance">
  {state==='loading'&&<span>Points: loading…</span>}
  {state==='ok'&&typeof balance==='number'&&<span><strong>{balance}</strong> {balance===1?'point':'points'}</span>}
  {state==='error'&&<><span>Points could not load.</span><button type="button" className="text-button" onClick={onRetry}>Retry</button></>}
  {state==='guest'&&<span><strong>{guestPoints}</strong> guest {guestPoints===1?'point':'points'} · this browser only</span>}
 </div>;
}
