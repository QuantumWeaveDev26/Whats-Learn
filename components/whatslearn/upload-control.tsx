'use client';
import {useCallback,useEffect,useState} from 'react';
type F={id:string;name:string;mime:string;bytes:number};
/** Optional private files for a practical task. Shown only when the site has file storage switched on and the learner is signed in; otherwise it renders nothing. */
export default function UploadControl({missionId,guest}:{missionId:string;guest:boolean}){
 const [on,setOn]=useState(false),[rules,setRules]=useState(''),[files,setFiles]=useState<F[]>([]),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{try{const r=await fetch('/api/uploads?mission='+encodeURIComponent(missionId));if(!r.ok){setOn(false);return}const d=await r.json() as {enabled:boolean;rules:string;files:F[]};setOn(d.enabled);setRules(d.rules);setFiles(d.files)}catch{setOn(false)}},[missionId]);
 useEffect(()=>{if(guest){Promise.resolve().then(()=>setOn(false));return}Promise.resolve().then(load)},[guest,load]);
 if(guest||!on)return null;
 async function add(file:File|undefined){if(!file)return;setBusy(true);setMsg('');try{const f=new FormData();f.set('mission',missionId);f.set('file',file);const r=await fetch('/api/uploads',{method:'POST',body:f});const d=await r.json() as {error?:string};setMsg(r.ok?'File saved privately.':d.error||'The file could not be saved.');await load()}catch{setMsg('Could not reach the server. Please try again.')}finally{setBusy(false)}}
 async function remove(id:string){setBusy(true);try{const r=await fetch('/api/uploads/'+id,{method:'DELETE'});setMsg(r.ok?'File deleted.':'The file could not be deleted. Please try again.');await load()}catch{setMsg('Could not reach the server. Please try again.')}finally{setBusy(false)}}
 return <div className="upload-control"><label htmlFor={'file-'+missionId} className="form-label">Add proof (optional): image, PDF or short video</label><input id={'file-'+missionId} type="file" disabled={busy} accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,video/mp4,video/webm" onChange={e=>{void add(e.target.files?.[0]);e.target.value=''}}/><p className="small muted">{rules}</p>{files.length>0&&<ul>{files.map(f=><li key={f.id}><a href={'/api/uploads/'+f.id}>{f.name}</a> ({Math.round(f.bytes/1024)} KB) <button type="button" className="text-button" disabled={busy} onClick={()=>remove(f.id)}>Delete</button></li>)}</ul>}{msg&&<p role="status" className="small">{msg}</p>}</div>;
}
