'use client';
import {useEffect,useState} from 'react';
import {ensureLanguagePack} from '@/lib/translations';
export function useLessonLanguage(language:string){
 const [state,setState]=useState({language:'',status:'loading'}),[attempt,setAttempt]=useState(0);const inline=language==='en';
 useEffect(()=>{let live=true;if(inline)return;setState({language,status:'loading'});ensureLanguagePack(language).then(ok=>{if(live)setState({language,status:ok?'ready':'error'})}).catch(()=>{if(live)setState({language,status:'error'})});return()=>{live=false}},[language,attempt,inline]);
 return {ready:inline||state.language===language&&state.status==='ready',error:!inline&&state.language===language&&state.status==='error',retry:()=>setAttempt(n=>n+1)};
}
export function LanguageLoading({state}:{state:{error:boolean;retry:()=>void}}){return <p role={state.error?'alert':'status'}>{state.error?'Your lesson language could not load.':'Loading your lesson language…'}{state.error&&<button type="button" className="text-button" onClick={state.retry}>Retry language</button>}</p>}
