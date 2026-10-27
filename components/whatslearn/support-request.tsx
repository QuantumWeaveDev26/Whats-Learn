'use client';
import {useEffect,useRef,useState} from 'react';
import {Inbox,CheckCircle2,Mail} from 'lucide-react';
import {supportCategories} from '@/lib/quality/options';
type RecordItem={id:string;category?:string;description?:string;reason?:string;answer_excerpt?:string;status:string;resolution:string;created_at:string};
type Data={requests:RecordItem[];reports:RecordItem[];attachment:RecordItem|null;error?:string};
export default function SupportRequest({accountKey}:{accountKey:string}){
 const[data,setData]=useState<Data|null>(null),[loadError,setLoadError]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[category,setCategory]=useState('learning'),[description,setDescription]=useState(''),[attached,setAttached]=useState(true),[saved,setSaved]=useState('');const key=useRef(''),generation=useRef(0),report=useRef('');
 async function load(){const g=++generation.current;setLoading(true);setLoadError('');try{const r=await fetch('/api/support'+(report.current?'?report='+encodeURIComponent(report.current):''),{cache:'no-store',headers:{'x-whatslearn-account':accountKey}});const d=await r.json() as Data;if(!r.ok)throw Error(d.error||'Requests unavailable.');if(g===generation.current)setData(d)}catch(e){if(g===generation.current){setData(null);setLoadError(e instanceof Error?e.message:'Requests unavailable.')}}finally{if(g===generation.current)setLoading(false)}}
 useEffect(()=>{key.current=crypto.randomUUID();report.current=new URLSearchParams(window.location.search).get('report')||'';void load();const refresh=()=>{if(!document.hidden)void load()};window.addEventListener('focus',refresh);return()=>{generation.current++;window.removeEventListener('focus',refresh)}},[accountKey]);
 async function submit(e:React.FormEvent){e.preventDefault();if(busy||!data)return;setBusy(true);setError('');try{const r=await fetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json','x-whatslearn-account':accountKey},body:JSON.stringify({category,description,...(attached&&data.attachment?{reportId:data.attachment.id}:{}),idempotencyKey:key.current})});const d=await r.json() as {id?:string;error?:string};if(!r.ok)throw Error(d.error||'Request could not save.');setSaved(d.id!);await load()}catch(e){setError(e instanceof Error?e.message:'Request could not save.')}finally{setBusy(false)}}
 return <section className="quality-panel support-workspace">
  <div className="support-compose">
   {loading&&<p className="small" role="status">Loading your requests…</p>}
   {loadError&&<div className="account-card support-load-error" role="alert"><p>{loadError}</p><button className="outline" onClick={()=>void load()}>Try again</button></div>}
   {data&&!saved&&<form className="account-card support-form" onSubmit={submit}><h2>Send a request</h2>
    <label>What do you need help with?<select value={category} onChange={e=>setCategory(e.target.value)}>{Object.entries(supportCategories).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
    <label>What happened?<textarea minLength={10} maxLength={2000} required value={description} onChange={e=>setDescription(e.target.value)} placeholder="Where did you get stuck?"/></label>
    {data.attachment?<div className="support-attachment"><label><input type="checkbox" checked={attached} onChange={e=>setAttached(e.target.checked)}/> Include the mentor reply</label><details><summary>View attached reply</summary><blockquote>{data.attachment.answer_excerpt}</blockquote></details></div>:report.current&&<p className="small">That reply is unavailable. You can still describe the problem.</p>}
    <div className="support-send"><span className="small">Our team replies here. This isn’t live chat.</span><button className="primary" type="submit" disabled={busy||description.trim().length<10}>{busy?'Sending…':'Send request'}</button></div>
    {error&&<p role="alert" className="support-error">{error}</p>}
   </form>}
   {saved&&<div className="account-card support-received" role="status"><CheckCircle2 size={32}/><h2>Request received</h2><p>Reference <strong>{saved.slice(0,8)}</strong></p><p className="small">Your team’s reply will appear in Your requests.</p><button className="outline" onClick={()=>{key.current=crypto.randomUUID();setDescription('');setSaved('');setError('')}}>Send another request</button><details><summary>Full reference</summary><p className="small">{saved}</p></details></div>}
  </div>
  <aside className="support-sidebar">
   {data&&<section className="account-card support-history"><div className="support-history-heading"><h2>Your requests</h2><button className="text-button" disabled={loading} onClick={()=>void load()}>Refresh</button></div>
    {!data.requests.length?<div className="support-empty"><Inbox size={30} aria-hidden="true"/><strong>No requests yet</strong><p>Your updates will appear here.</p></div>:<div className="support-records">{data.requests.map(x=><article className="support-record" key={x.id}><div><strong>{x.id.slice(0,8)}</strong><span className={'support-status support-status-'+x.status}>{x.status==='acknowledged'?'In review':x.status==='resolved'?'Resolved':'Received'}</span></div><p className="small">{new Date(x.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p><details><summary>View request</summary><p>{x.description}</p></details>{x.resolution&&<p className="support-resolution"><strong>Team update:</strong> {x.resolution}</p>}</article>)}</div>}
    {data.reports.length>0&&<details className="support-reports"><summary>Reported replies ({data.reports.length})</summary>{data.reports.map(x=><article key={x.id} className="support-record"><strong>{x.id.slice(0,8)} · {x.status==='acknowledged'?'In review':x.status==='resolved'?'Resolved':'Received'}</strong><p>{(x.reason||'').replaceAll('_',' ')}</p>{x.resolution&&<p>Team update: {x.resolution}</p>}</article>)}</details>}
    <p className="support-history-note">Recent requests. Resolved items stay for 90 days.</p>
   </section>}
   <section className="account-card support-email"><Mail size={22} aria-hidden="true"/><div><h2>Prefer email?</h2><a href="mailto:connect@brandmintai.io">connect@brandmintai.io</a></div></section>
  </aside>
 </section>;
}
