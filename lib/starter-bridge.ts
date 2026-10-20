import {agencyTracks,readAgencyDrafts,type AgencyDraft} from './agency-story';
/** Connects the home-page agency starter to the first full mission in each programme. */
const bridges:Record<string,string>={
 marketing:'Back at the agency: the Friday-launch client is a Bengaluru home-meal service selling weekday lunches. Your starter hook is your first draft. Grow it into the full offer below.',
 development:'Back at the agency: your approval flow worked, so the agency is taking on a build client. A local tutor needs a booking page. Use the same thinking: what is sent, what confirms it, and what happens when it fails.',
 filmmaking:'Back at the agency: your launch-film moment becomes a full 30-second mini-film. Keep the same shape: someone wants something, faces a choice and acts.',
 storytelling:'Back at the agency: the next client is a neighbourhood library. Use the three-frame shape from your starter: a problem, a change and an invitation.'
};
export type StarterPiece={track:string;mission:string;outcome:string;bridge:string;draft:AgencyDraft};
export function starterPieces(scope='guest'):StarterPiece[]{const drafts=readAgencyDrafts(scope);return agencyTracks.filter(t=>drafts[t.id]).map(t=>({track:t.id,mission:t.mission,outcome:t.outcome,bridge:bridges[t.id],draft:drafts[t.id]!}))}
export function starterFor(missionId:string,scope='guest'){return starterPieces(scope).find(s=>s.mission===missionId)}

export function starterFromAccount(track:string,draft:AgencyDraft):StarterPiece|null{const t=agencyTracks.find(t=>t.id===track);return t?{track:t.id,mission:t.mission,outcome:t.outcome,bridge:bridges[t.id],draft}:null}
