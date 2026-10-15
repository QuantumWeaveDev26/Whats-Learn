'use client';
import {useState} from 'react';
import {Coins,Check,Lightbulb} from 'lucide-react';
import {quizFeedback} from '@/lib/quiz-feedback';
import {lessonLanguage} from '@/lib/languages';
import {miniChallenge} from '@/lib/play';
import {languagePacks} from '@/lib/translations';
const labels:Record<string,{tag:string;retry:string;save:string;saved:string;hint:string}>={en:{tag:'30-SECOND SIDE QUEST',retry:'Try again. Use the clue below.',save:'Collect my practice coin',saved:'Practice coin collected',hint:'Show a clue'},kn:{tag:'30 ಸೆಕೆಂಡಿನ ಕಿರು ಸವಾಲು',retry:'ಸೂಚನೆ ನೋಡಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',save:'ಅಭ್ಯಾಸದ ನಾಣ್ಯ ಪಡೆಯಿರಿ',saved:'ಅಭ್ಯಾಸದ ನಾಣ್ಯ ಸಿಕ್ಕಿದೆ',hint:'ಸೂಚನೆ ತೋರಿಸಿ'},hi:{tag:'30 सेकंड की छोटी चुनौती',retry:'संकेत देखकर फिर कोशिश करें।',save:'अभ्यास का सिक्का लें',saved:'अभ्यास का सिक्का मिला',hint:'संकेत दिखाएँ'}};
export default function MiniChallenge({missionId,language='en',earned,onEarn,ready=true,onClue,clueNote=''}:{missionId:string;language?:string;earned:boolean;onEarn:(choice:number)=>Promise<void>;ready?:boolean;onClue?:()=>void|Promise<boolean>;clueNote?:string}){
 const [choice,setChoice]=useState(-1),[hint,setHint]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const m=miniChallenge(missionId,language),t=labels[language]||languagePacks[language]?.labels||labels.en;
 async function collect(){setBusy(true);setError('');try{await onEarn(choice)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section className="mini-quest" lang={lessonLanguage(language)}><span className="play-label">{t.tag}</span><h3>{m.q}</h3><div className="mini-choices">{m.options.map((o,i)=><button key={o} aria-pressed={choice===i} onClick={()=>setChoice(i)}><span>{i?'B':'A'}</span>{o}</button>)}</div><button className="quest-hint" onClick={async()=>{if(!hint&&(await onClue?.())===false)return;setHint(!hint)}} aria-expanded={hint}><Lightbulb size={17}/>{t.hint}{clueNote}</button>{(hint||choice>=0)&&<p role="status">{choice>=0?quizFeedback(language,choice===m.answer,'',m.why).text:m.why}</p>}{earned?<p className="quest-earned"><Check size={17}/>{t.saved} · +1</p>:choice===m.answer&&<button className="outline" disabled={busy||!ready} onClick={collect}><Coins size={17}/>{busy?'Saving…':t.save}</button>}{error&&<p role="alert">{error}</p>}</section>;
}
