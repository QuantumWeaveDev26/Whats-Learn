export type RemoteDraft={body:string;revision:number;status:'active'|'closed';source:string};
type Phase='loading'|'ready'|'saving'|'error'|'conflict';
type Options={body:string;hasLocal:boolean;read:()=>Promise<RemoteDraft|null>;write:(body:string,revision:number)=>Promise<RemoteDraft>;apply:(body:string)=>void;changed:()=>void};
/** One editor instance. No account/global state, assessment, timers or network hidden inside this machine. */
export class DraftSyncMachine{
 body:string;private saved:string;private revision:number|null=null;private remote:RemoteDraft|null=null;private phase:Phase='loading';private dirty=false;private busy=false;private alive=true;private queuedSave=false;private error='';
 constructor(private o:Options){this.body=o.body;this.saved=o.body;}
 snapshot(){return {phase:this.phase,dirty:this.dirty,saved:this.revision!==null&&this.revision>0&&this.remote?.status==='active'&&!this.dirty,remoteBody:this.remote?.body||'',remoteSource:this.remote?.source||'account',error:this.error};}
 private drain(){if(this.queuedSave){this.queuedSave=false;if(this.alive&&this.phase!=='conflict')void this.save();}}
 private emit(){if(this.alive)this.o.changed();}
 edit(body:string){if(!this.alive)return;this.body=body;this.dirty=body!==this.saved;this.emit();}
 async initialize(){if(this.busy||!this.alive)return;this.busy=true;this.phase='loading';this.emit();try{const r=await this.o.read();if(!this.alive)return;this.remote=r;this.revision=r?.revision||0;
  if(r&&(r.status==='active'||this.o.hasLocal)&&(this.o.hasLocal||this.dirty)&&this.body!==r.body){this.phase='conflict';}
  else if(r?.status==='active'){this.body=r.body;this.saved=r.body;this.dirty=false;this.phase='ready';this.o.apply(r.body);}
  else{this.phase='ready';this.dirty=this.dirty||this.o.hasLocal&&!!this.body.trim();}
 }catch(e){if(this.alive){this.phase='error';this.error=e instanceof Error?e.message:'Draft sync unavailable.';}}finally{this.busy=false;this.emit();this.drain();}}
 async refresh(){if(!this.alive||this.busy||this.phase==='conflict')return;if(this.revision===null)return this.initialize();this.busy=true;try{const r=await this.o.read();if(!this.alive)return;
  if((r?.revision||0)!==this.revision){this.remote=r;if(this.dirty||r?.status==='closed'){this.phase='conflict';}else{this.revision=r?.revision||0;this.body=r?.body||'';this.saved=this.body;this.dirty=false;this.phase='ready';this.o.apply(this.body);}}
  else if(this.phase==='error')this.phase='ready';
 }catch(e){if(this.alive){this.phase='error';this.error=e instanceof Error?e.message:'Draft sync unavailable.';}}finally{this.busy=false;this.emit();this.drain();}}
 async save(){if(!this.alive||this.revision===null||this.phase==='conflict'||!this.dirty)return;if(this.busy){this.queuedSave=true;return;}const body=this.body,revision=this.revision;this.busy=true;this.phase='saving';this.emit();try{const d=await this.o.write(body,revision);if(!this.alive)return;this.revision=d.revision;this.remote=d;this.saved=body;this.dirty=this.body!==body;this.phase='ready';this.error='';}
 catch(e){if(!this.alive)return;if((e as {status?:number}).status===409){try{this.remote=await this.o.read();if(this.alive)this.phase='conflict';}catch{if(this.alive){this.phase='error';this.error='Could not load the other draft. Retry; your text is kept.';}}}else{this.phase='error';this.error=e instanceof Error?e.message:'Draft sync unavailable.';}}
 finally{this.busy=false;this.emit();this.drain();}}
 useRemote(){if(!this.alive||this.busy||this.phase!=='conflict')return;this.revision=this.remote?.revision||0;this.body=this.remote?.body||'';this.saved=this.body;this.dirty=false;this.phase='ready';this.o.apply(this.body);this.emit();}
 async keepLocal(){if(!this.alive||this.busy||this.phase!=='conflict')return;this.revision=this.remote?.revision||0;this.saved=this.remote?.body||'';this.dirty=true;this.phase='ready';await this.save();}
 async retry(){if(this.phase==='conflict')return;await this.refresh();if(this.alive&&this.phase==='ready'&&this.dirty)await this.save();}
 dispose(){this.alive=false;}
}
