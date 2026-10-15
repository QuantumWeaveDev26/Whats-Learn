/**
 * The mascot reacts only to real successes. Call this after the action has succeeded (a clue was recorded, a mission was saved, a mini challenge was cleared), never when a button is merely clicked.
 */
export type MascotMoment='clue'|'mission'|'checkpoint';
export const MASCOT_EVENT='whatslearn:mascot';
export function mascotMoment(kind:MascotMoment){
 if(typeof window==='undefined')return;
 try{window.dispatchEvent(new CustomEvent(MASCOT_EVENT,{detail:{kind}}))}catch{/* decorative only */}
}
