'use client';
import {Component,lazy,Suspense,useMemo,useState,type ComponentType,type ReactNode} from 'react';
class ToolError extends Component<{children:ReactNode;retry:()=>void},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<p role="alert">This tool could not load. <button type="button" className="text-button" onClick={this.props.retry}>Retry tool</button></p>:this.props.children}
}
export default function DeferredPanel<P extends object>({label,load,toolProps}:{label:string;load:()=>Promise<{default:ComponentType<P>}>;toolProps:P}){
 const [opened,setOpened]=useState(false),[attempt,setAttempt]=useState(0);const Tool=useMemo(()=>lazy(load),[load,attempt]);
 return <details className="learning-details" onToggle={e=>{if(e.currentTarget.open)setOpened(true)}}><summary>{label}</summary>{opened&&<ToolError key={attempt} retry={()=>setAttempt(n=>n+1)}><Suspense fallback={<p role="status">Loading tool…</p>}><Tool {...toolProps}/></Suspense></ToolError>}</details>;
}
