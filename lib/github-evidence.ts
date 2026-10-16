/** Public, bounded, commit-pinned source review. Never follows repository URLs or executes code. */
export type RepoEvidence={repository:string;commit:string;files:{path:string;content:string}[];truncated:boolean};
export function githubRepo(value:string){
 let u:URL;try{u=new URL(value)}catch{return null}
 if(u.protocol!=='https:'||u.hostname!=='github.com'||u.port||u.username||u.password||u.search||u.hash)return null;
 const m=u.pathname.match(/^\/([A-Za-z0-9-]{1,39})\/([A-Za-z0-9_.-]{1,100})(?:\/)?$/);
 const repo=m?.[2].replace(/\.git$/,'');return m&&repo&&repo!=='.'&&repo!=='..'?{owner:m[1],repo}:null;
}
async function api(path:string,limit=800000):Promise<any>{
 const r=await fetch('https://api.github.com'+path,{headers:{Accept:'application/vnd.github+json','User-Agent':'WhatsLearn-source-review'},redirect:'error',signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw new Error(r.status===403||r.status===429?'GitHub is rate limited. Try the review later.':'The public GitHub repository could not be read. Check its URL and visibility.');
 const reader=r.body?.getReader();if(!reader)throw new Error('GitHub returned no source.');
 const chunks:Uint8Array[]=[];let size=0;try{while(true){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>limit)throw new Error('Repository response is too large for this review.');chunks.push(x.value)}}finally{await reader.cancel()}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}return JSON.parse(new TextDecoder().decode(bytes));
}
export const reviewablePath=(path:string)=>!/(^|\/)(\.|node_modules|vendor|dist|build|coverage|package-lock|pnpm-lock|yarn\.lock)|secret|credential|\.pem$|\.key$/i.test(path)&&/\.(md|tsx?|jsx?|py|sql|html|css|json)$/i.test(path);
export async function githubEvidence(url:string):Promise<RepoEvidence>{
 const p=githubRepo(url);if(!p)throw new Error('Use the public repository root: https://github.com/owner/repository.');
 const base='/repos/'+encodeURIComponent(p.owner)+'/'+encodeURIComponent(p.repo);
 const head=await api(base+'/commits/HEAD',200000);if(!/^[a-f0-9]{40}$/.test(head.sha)||!/^[a-f0-9]{40}$/.test(head.commit?.tree?.sha))throw new Error('GitHub did not return a valid commit.');
 const tree=await api(base+'/git/trees/'+head.commit.tree.sha+'?recursive=1');
 const candidates=(tree.tree||[]).filter((f:any)=>f.type==='blob'&&f.mode==='100644'&&typeof f.path==='string'&&f.size>0&&f.size<=16000&&/^[a-f0-9]{40}$/.test(f.sha)&&reviewablePath(f.path)).sort((a:any,b:any)=>Number(!/readme/i.test(a.path))-Number(!/readme/i.test(b.path))||Number(!/test|spec/i.test(a.path))-Number(!/test|spec/i.test(b.path))||a.path.localeCompare(b.path));
 const files:RepoEvidence['files']=[];let remaining=32000;
 for(const f of candidates.slice(0,6)){const blob=await api(base+'/git/blobs/'+f.sha,30000);if(blob.encoding!=='base64'||typeof blob.content!=='string')throw new Error('GitHub source encoding could not be read.');const raw=Uint8Array.from(atob(blob.content.replace(/\s/g,'')),c=>c.charCodeAt(0));if(raw.length>16000)throw new Error('Source file exceeds the review limit.');const content=new TextDecoder().decode(raw).slice(0,remaining);if(content.includes('\u0000'))continue;files.push({path:f.path,content});remaining-=content.length;if(remaining<=0)break}
 if(!files.length)throw new Error('No supported source files were found. Add a README and small source or test files.');
 return {repository:'https://github.com/'+p.owner+'/'+p.repo,commit:head.sha,files,truncated:!!tree.truncated||candidates.length>files.length||remaining===0};
}
