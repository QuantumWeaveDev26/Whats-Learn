const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),React=require('react');
const root=path.resolve(__dirname,'../..'),nothing=()=>null;
function hooks(){
 const slots=[];let cursor=0;const effects=[];
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
 const api={...React,useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next]},useRef(v){const i=cursor++;return slots[i]??={current:v}},useMemo(fn,deps){const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps))slots[i]={deps,value:fn()};return slots[i].value},useEffect(fn,deps){const i=cursor++;if(!same(slots[i]?.deps,deps)){slots[i]?.cleanup?.();slots[i]={deps};effects.push(()=>slots[i].cleanup=fn())}}};
 api.useCallback=(fn,deps)=>api.useMemo(()=>fn,deps);
 return {api,start(){cursor=0},async flush(){while(effects.length)effects.shift()();await new Promise(r=>setImmediate(r))},unmount(){for(const slot of slots)slot?.cleanup?.();effects.length=0}};
}
function load(file,h=hooks(),overrides={},cache=new Map()){
 if(cache.has(file))return cache.get(file);
 const output=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const mod={exports:{}};
 const get=id=>{if(id in overrides)return overrides[id];if(id==='react')return h.api;if(id==='lucide-react')return new Proxy({},{get:()=>nothing});if(id.startsWith('@/')||id.startsWith('.')){const base=id.startsWith('@/')?id.slice(2):path.join(path.dirname(file),id);const resolved=['','.ts','.tsx','.json','/index.ts','/index.tsx'].map(ext=>base+ext).find(p=>fs.existsSync(path.join(root,p))&&fs.statSync(path.join(root,p)).isFile());if(resolved?.endsWith('.json'))return JSON.parse(fs.readFileSync(path.join(root,resolved),'utf8'));if(resolved)return load(resolved,h,overrides,cache)}return require(id)};
 new Function('require','module','exports',output)(get,mod,mod.exports);cache.set(file,mod.exports);return mod.exports;
}
function find(node,fn){if(!node||typeof node!=='object')return;if(fn(node))return node;for(const child of React.Children.toArray(node.props?.children)){const result=find(child,fn);if(result)return result}}
function all(node,fn){const out=[];if(node&&typeof node==='object'){if(fn(node))out.push(node);for(const child of React.Children.toArray(node.props?.children))out.push(...all(child,fn))}return out}
const text=node=>typeof node==='string'||typeof node==='number'?String(node):node?.props?React.Children.toArray(node.props.children).map(text).join(''):'';
module.exports={hooks,load,find,all,text};
