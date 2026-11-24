'use client';

import {useEffect,useRef,useState} from 'react';
import {api} from './api';

const route='/app/avatar';
const size=256;

async function preparePhoto(file:File){
 if(!file.type.startsWith('image/')||file.size>12*1024*1024)throw Error('photo');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();
  image.src=url;
  await image.decode();
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const context=canvas.getContext('2d',{alpha:false});
  const side=Math.min(image.naturalWidth,image.naturalHeight);
  if(!context||!side)throw Error('photo');
  context.fillStyle='#fff';
  context.fillRect(0,0,size,size);
  context.drawImage(image,(image.naturalWidth-side)/2,(image.naturalHeight-side)/2,side,side,0,0,size,size);
  return canvas.toDataURL('image/jpeg',0.82);
 }finally{URL.revokeObjectURL(url)}
}

export function useAppAvatar(accountKey:string){
 const owner=useRef(accountKey);
 owner.current=accountKey;
 const saving=useRef('');
 const [attempt,retry]=useState(0);
 const [failedOwner,setFailedOwner]=useState('');
 const [state,setState]=useState<{owner:string;photo:string|null;ready:boolean}>({owner:'',photo:null,ready:false});
 const [status,setStatus]=useState<{owner:string;busy:boolean;message:string}>({owner:'',busy:false,message:''});
 useEffect(()=>{
  if(!accountKey)return;
  let active=true;
  setFailedOwner('');
  void api<{photo:string|null}>(route,{accountKey,timeoutMs:10000}).then(result=>{
   if(!active)return;
   if(result.ok&&(result.data.photo===null||typeof result.data.photo==='string'))setState({owner:accountKey,photo:result.data.photo,ready:true});
   else setFailedOwner(accountKey);
  });
  return()=>{active=false};
 },[accountKey,attempt]);
 async function update(file:File|null){
  if(!accountKey||saving.current===accountKey)return;
  saving.current=accountKey;
  setStatus({owner:accountKey,busy:true,message:''});
  let message='';
  try{
   const photo=file?await preparePhoto(file):null;
   if(owner.current!==accountKey)return;
   const result=await api(route,{method:file?'POST':'DELETE',body:file?{photo}:undefined,accountKey,timeoutMs:15000});
   if(!result.ok){message='Could not update your photo. Try again.';return}
   if(owner.current===accountKey)setState({owner:accountKey,photo,ready:true});
   message=file?'Photo saved.':'Photo removed.';
  }catch{message='Choose a supported image under 12 MB.'}
  finally{
   if(saving.current===accountKey)saving.current='';
   if(owner.current===accountKey)setStatus({owner:accountKey,busy:false,message});
  }
 }
 return {
  src:state.owner===accountKey?state.photo:null,
  ready:state.owner===accountKey&&state.ready,
  busy:status.owner===accountKey&&status.busy,
  message:status.owner===accountKey?status.message:'',
  loadFailed:!!accountKey&&failedOwner===accountKey,
  retry:()=>retry(i=>i+1),
  update,
 };
}
export type AppAvatar=ReturnType<typeof useAppAvatar>;
