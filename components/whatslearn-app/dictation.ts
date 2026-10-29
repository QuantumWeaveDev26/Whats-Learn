'use client';
import {useEffect,useRef,useState} from 'react';

type SpeechResult={isFinal:boolean;0?:{transcript:string}};
type SpeechSession={lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number;start:()=>void;stop:()=>void;abort:()=>void;onresult:((event:{results:ArrayLike<SpeechResult>})=>void)|null;onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null};
type SpeechConstructor=new()=>SpeechSession;
const locale:Record<string,string>={en:'en-IN',hi:'hi-IN',kn:'kn-IN',ta:'ta-IN',te:'te-IN',ml:'ml-IN',mr:'mr-IN',gu:'gu-IN',bn:'bn-IN',pa:'pa-IN',or:'or-IN'};

/** Optional browser dictation. It only edits the question; sending remains manual. */
export function useDictation({language,value,onChange}:{language:string;value:string;onChange:(text:string)=>void}){
 const [listening,setListening]=useState(false),[message,setMessage]=useState('');
 const active=useRef<SpeechSession|null>(null);
 useEffect(()=>()=>{const session=active.current;active.current=null;if(session){session.onresult=null;session.onerror=null;session.onend=null;try{session.abort()}catch{}}},[]);
 function toggle(){
  if(active.current){const session=active.current;try{session.stop()}catch{active.current=null;session.onresult=null;session.onerror=null;session.onend=null;try{session.abort()}catch{}setListening(false);setMessage('Voice input stopped. Review the text or type your question.')}return}
  const host=typeof window==='undefined'?{}:window as unknown as {SpeechRecognition?:SpeechConstructor;webkitSpeechRecognition?:SpeechConstructor};
  const Recognizer=host.SpeechRecognition||host.webkitSpeechRecognition;
  if(!Recognizer){setMessage('Voice input is not available in this browser. Type your question or use your keyboard’s microphone.');return}
  if(value.length>=500){setMessage('Your question is at the 500-character limit. Shorten it before dictating.');return}
  let session:SpeechSession;
  try{session=new Recognizer()}catch{setMessage('Voice input could not start. Please type your question.');return}
  active.current=session;session.lang=locale[language]||language;session.continuous=false;session.interimResults=false;session.maxAlternatives=1;
  const prefix=value.trimEnd();
  session.onresult=event=>{if(active.current!==session)return;const transcript=Array.from(event.results).filter(result=>result.isFinal).map(result=>result[0]?.transcript||'').join(' ').trim();if(transcript)onChange([prefix,transcript].filter(Boolean).join(' ').slice(0,500))};
  session.onend=()=>{if(active.current!==session)return;active.current=null;setListening(false);setMessage('Review your question, then tap Send.')};
  session.onerror=event=>{if(active.current!==session)return;active.current=null;setListening(false);session.onresult=null;session.onerror=null;session.onend=null;try{session.abort()}catch{}
   setMessage(event.error==='not-allowed'||event.error==='service-not-allowed'?'Microphone permission is blocked. You can still type your question.':event.error==='no-speech'?'No speech was detected. Try the mic again or type your question.':event.error==='network'?'Voice input needs a connection to your browser’s speech service. You can still type.':event.error==='language-not-supported'?'Your browser cannot dictate in this language. Please type your question.':'Voice input stopped. Review the text or type your question.');
  };
  setListening(true);setMessage('Listening… tap the microphone again to stop.');
  try{session.start()}catch{active.current=null;session.onresult=null;session.onerror=null;session.onend=null;try{session.abort()}catch{}setListening(false);setMessage('Voice input could not start. Check microphone permission or type your question.')}
 }
 return {listening,message,toggle};
}
