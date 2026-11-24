'use client';

import {useEffect,useState} from 'react';

type Copy = Record<string,string>;
const loaded: Record<string,Copy> = {};
const pending = new Map<string,Promise<boolean>>();
const loaders: Record<string,()=>Promise<{default:Copy}>> = {
 hi:()=>import('./copy/hi.json'),kn:()=>import('./copy/kn.json'),ta:()=>import('./copy/ta.json'),
 te:()=>import('./copy/te.json'),ml:()=>import('./copy/ml.json'),pa:()=>import('./copy/pa.json'),
 sa:()=>import('./copy/sa.json'),mr:()=>import('./copy/mr.json'),gu:()=>import('./copy/gu.json'),
 bn:()=>import('./copy/bn.json'),or:()=>import('./copy/or.json'),mni:()=>import('./copy/mni.json'),
};

export function findAppCopy(language:string,text:string) {
 const copy=loaded[language];
 const key=text.trim().replace(/\s+/g,' ');
 return copy&&Object.hasOwn(copy,key)?copy[key]:undefined;
}

export function loadAppCopy(language:string):Promise<boolean> {
 if(!loaders[language]||loaded[language])return Promise.resolve(true);
 const previous=pending.get(language);
 if(previous)return previous;
 const request=loaders[language]().then(pack=>{
  loaded[language]=pack.default;
  return true;
 }).catch(()=>false).finally(()=>pending.delete(language));
 pending.set(language,request);
 return request;
}

export function useAppCopy(language:string){
 const [result,setResult]=useState<{language:string;ok:boolean}|null>(null);
 const [attempt,retry]=useState(0);
 useEffect(()=>{
  let active=true;
  if(!loaded[language]&&loaders[language])setResult(null);
  void loadAppCopy(language).then(ok=>{if(active)setResult({language,ok})});
  return()=>{active=false};
 },[language,attempt]);
 return {
  ready:!loaders[language]||!!loaded[language],
  error:result?.language===language&&!result.ok,
  retry:()=>retry(current=>current+1),
 };
}
