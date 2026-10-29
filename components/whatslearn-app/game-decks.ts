'use client';
import {useEffect,useMemo} from 'react';
import {readLocal,writeLocal} from './api';
import {hookFeed,budgetRounds,bugRounds,flowRounds,shotRounds,captionRounds,diceItems,type GameId} from './games-data';
import {extraHooks,extraBudgets,extraBugs,extraFlows,extraShots,extraCaptions} from './game-bank-extra';

export type ShotCard={type:number;scene:string;sky:string;ground:string;shirt:string;offset:number};
export type StoryPrompt={items:string[];brief:string};
const scenes=[
 {scene:'At the station',sky:'#DFE7F1',ground:'#B5C9DD',shirt:'#295781',offset:-10},
 {scene:'In a rehearsal room',sky:'#EEE1D9',ground:'#D6BDAA',shirt:'#824E3A',offset:12},
 {scene:'Beside the garden',sky:'#E4EDD9',ground:'#BBCEA8',shirt:'#456A39',offset:-16},
 {scene:'Inside the library',sky:'#E9E1F0',ground:'#D0BEDD',shirt:'#685079',offset:6},
 {scene:'Outside the café',sky:'#F3E6CF',ground:'#DDC59C',shirt:'#845F26',offset:16},
 {scene:'At the community workshop',sky:'#DCECE8',ground:'#AED0C7',shirt:'#2F6B5A',offset:-4}
];
const shotCards:ShotCard[]=scenes.flatMap(s=>Array.from({length:5},(_,type)=>({...s,type})));
const constraints=['Show a small decision that changes the ending.','Tell a story about helping someone.','Make the middle frame introduce a surprise.','Show a mistake and a repair.','Set the story on a journey.','Let the ending change how we understand the beginning.'];
const storyPrompts:StoryPrompt[]=[];
for(let a=0;a<diceItems.length-2;a++)for(let b=a+1;b<diceItems.length-1;b++)for(let c=b+1;c<diceItems.length;c++)storyPrompts.push({items:[diceItems[a],diceItems[b],diceItems[c]],brief:constraints[(a*7+b+c)%constraints.length]});
export const banks={
 'hook-hunter':[...hookFeed,...extraHooks],
 'budget-boss':[...budgetRounds,...extraBudgets],
 'bug-hunt':[...bugRounds,...extraBugs],
 'build-the-flow':[...flowRounds,...extraFlows].map(r=>({title:r.title,items:r.steps,why:r.why})),
 'shot-order':[...shotRounds,...extraShots].map(r=>({title:r.title,items:r.frames,why:r.why})),
 'guess-the-shot':shotCards,
 'story-dice':storyPrompts,
 'caption-it':[...captionRounds,...extraCaptions]
};
export const roundCounts:Record<GameId,number>={'hook-hunter':6,'budget-boss':3,'bug-hunt':5,'build-the-flow':3,'shot-order':3,'guess-the-shot':5,'story-dice':1,'caption-it':4};
type DeckState={v:1;seen:number[];last:number[]};
/** Pure selection: render may call this twice without consuming either run. */
export function selectUnseen(size:number,raw:string|null,count:number,rng:()=>number=Math.random):{indices:number[];state:string}{
 const valid=(list:unknown):number[]=>Array.isArray(list)?[...new Set(list.filter((n):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<size))]:[];
 let saved:Partial<DeckState>={};try{if(raw&&raw.length<50000){const parsed=JSON.parse(raw);if(parsed?.v===1)saved=parsed}}catch{}
 const seen=new Set(valid(saved.seen)),last=new Set(valid(saved.last)),indices:number[]=[];
 const wanted=Math.min(Math.max(0,size),Number.isFinite(count)?Math.max(0,Math.floor(count)):0);
 while(indices.length<wanted){
  let pool=Array.from({length:size},(_,i)=>i).filter(i=>!seen.has(i)&&!indices.includes(i));
  if(!pool.length){seen.clear();pool=Array.from({length:size},(_,i)=>i).filter(i=>!indices.includes(i))}
  const fresh=pool.filter(i=>!last.has(i));if(fresh.length)pool=fresh;
  const value=rng(),at=Number.isFinite(value)?Math.min(pool.length-1,Math.max(0,Math.floor(value*pool.length))):0;
  const picked=pool[at];indices.push(picked);seen.add(picked);
 }
 return {indices,state:JSON.stringify({v:1,seen:[...seen],last:indices})};
}
export type GameRun={[K in GameId]:{id:K;rounds:(typeof banks)[K];state:string}}[GameId];
const memory=new Map<string,string>();
const deckKey=(who:string,id:GameId)=>`wla-game-deck:v1:${who||'guest'}:${id}`;
function prepare(id:GameId,who:string):GameRun{
 const key=deckKey(who,id),selection=selectUnseen(banks[id].length,memory.get(key)||readLocal(key)||null,roundCounts[id]);
 return {id,rounds:selection.indices.map(i=>banks[id][i]),state:selection.state} as GameRun;
}
function commit(run:GameRun,who:string){const key=deckKey(who,run.id);if(writeLocal(key,run.state)===false)memory.set(key,run.state);else memory.delete(key)}
/** Actions such as Story Dice's one optional reroll may reserve another prompt. */
export function nextGameRun<K extends GameId>(id:K,who:string):Extract<GameRun,{id:K}>{const run=prepare(id,who);commit(run,who);return run as Extract<GameRun,{id:K}>}
export function useGameDeck(id:GameId,who:string):GameRun{
 const run=useMemo(()=>prepare(id,who),[id,who]);
 useEffect(()=>{commit(run,who)},[run,who]);
 return run;
}
