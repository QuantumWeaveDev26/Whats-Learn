import {agencyTrackText,agencyTracks,type AgencyTrack} from './agency-story';
import {missions} from './missions';
import {keywords,meaningful,stem,tokens} from './writing-check';
import {looksLikeGibberish,looksLikeMachineText} from './text-signals';
/**
 * Relevance check for the home-page starter piece. It runs on this device only and is not an AI review:
 * it rejects pasted logs or code, random letters, and text that has nothing to do with the chosen task,
 * while short answers in any supported language that talk about the task still pass.
 */
export type StarterCheck={ok:boolean;reason:'ok'|'too-short'|'machine'|'gibberish'|'off-topic';message:string};
/** Everyday words for each task, so natural answers count even when they don't repeat the brief's wording. */
const extra:Record<AgencyTrack,string>={
 marketing:'customer customers audience buyer buyers people students parents office workers shoppers offer discount order book call visit join try sign register download today now free launch product shop store brand message hook campaign ad advert post reel friday weekend lunch food cafe class course app service help reach notice want need',
 development:'client draft feedback approve approval approved review send sent receive version final confirm change changes edit comment comments email link button upload step steps flow workflow sign signoff deadline round revise revision team share',
 filmmaking:'person character wants want chooses choice decides acts action scene shot moment camera film video line lines says looks walks runs opens door stops friend mother father girl boy woman man',
 storytelling:'frame frames still image images picture pictures photo problem change invitation first second third before after shows show panel scene visual colour color',
};
const vocabulary=new Map<AgencyTrack,Set<string>>();
function vocab(track:AgencyTrack){
 const hit=vocabulary.get(track);if(hit)return hit;
 const set=new Set<string>();const mission=missions.find(m=>m.id===agencyTracks.find(t=>t.id===track)!.mission);
 for(const w of tokens(agencyTrackText(track).join(' ')))if(meaningful(w))set.add(stem(w));
 for(const w of extra[track].split(' '))set.add(stem(w));
 if(mission)for(const s of keywords(mission).all)set.add(s);
 vocabulary.set(track,set);return set;
}
export function checkStarter(track:AgencyTrack,body:string,task=''):StarterCheck{
 const text=body.trim();const again=task?` Your task: ${task}`:'';
 if(looksLikeMachineText(text))return {ok:false,reason:'machine',message:`This looks like copied server log, code or terminal text, not your answer. Write one or two sentences of your own.${again}`};
 const words=tokens(text);
 if(words.length<4)return {ok:false,reason:'too-short',message:`Write at least a short sentence (four words or more).${again}`};
 if(looksLikeGibberish(text)||new Set(words).size/words.length<0.35)return {ok:false,reason:'gibberish',message:`This doesn’t read as real words yet. Write a short answer in your own words, in any language.${again}`};
 const v=vocab(track);const hits=words.filter(w=>[...w].length>=3&&v.has(stem(w))).length;
 if(hits===0)return {ok:false,reason:'off-topic',message:`This doesn’t seem to answer the task yet. Mention who it is for or what happens, in your own words.${again}`};
 return {ok:true,reason:'ok',message:'Looks like a real answer to the task. This is a quick check on your device, not an AI review.'};
}
