'use client';
import {useEffect,useState} from 'react';
import MiniChallenge from './mini-challenge';
import {readGuestPlay,saveGuestPlay} from '@/lib/guest-play';
import {practiceDay,type PlayEvent} from '@/lib/play';
export default function QuickPlay({missionId,language}:{missionId:string;language:string}){
 const [events,setEvents]=useState<PlayEvent[]>([]),[guest,setGuest]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
 useEffect(()=>{let live=true;setError('');setReady(false);fetch('/api/play').then(async r=>{if(!live)return;if(r.status===401){setGuest(true);setEvents(readGuestPlay());setReady(true)}else if(r.ok){const d=await r.json() as {events:PlayEvent[]};if(live){setGuest(false);setEvents(d.events);setReady(true)}}else setError('Rewards are unavailable. You can still try the challenge.')}).catch(()=>{if(live)setError('Rewards are unavailable. You can still try the challenge.')});return()=>{live=false}},[attempt]);
 async function earn(choice:number){let now=new Date().toISOString();if(!guest){const r=await fetch('/api/play',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({missionId,choice})});const d=await r.json() as {error?:string;createdAt:string};if(!r.ok)throw new Error(d.error||'Please retry.');now=d.createdAt;}const newEvents:PlayEvent[]=[{event_id:`discover:${missionId}`,mission_id:missionId,kind:'discover',created_at:now},{event_id:`practice:${practiceDay(now)}`,mission_id:missionId,kind:'practice',created_at:now}];if(guest){let saved=events;for(const e of newEvents)saved=saveGuestPlay(e);setEvents(saved)}else setEvents(old=>[...old,...newEvents.filter(e=>!old.some(x=>x.event_id===e.event_id))]);}
 return <><MiniChallenge key={missionId+language} missionId={missionId} language={language} ready={ready} earned={events.some(e=>e.event_id===`discover:${missionId}`)} onEarn={earn}/>{error&&<p role="status">{error} <button className="text-button" onClick={()=>setAttempt(x=>x+1)}>Retry</button></p>}</>;
}
