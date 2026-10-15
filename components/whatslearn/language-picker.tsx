'use client';
import {languages,languageOptionLabel,lessonLanguages} from '@/lib/languages';
export default function LanguagePicker({value,onChange,id='learning-language',label='Choose your language',fullLanguages=lessonLanguages,fallbackLabel}:{value:string;onChange:(language:string)=>void;id?:string;label?:string;fullLanguages?:readonly string[];fallbackLabel?:string}){
 return <div className="language-picker"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={e=>onChange(e.target.value)}>{Object.keys(languages).map(code=><option key={code} value={code} lang={code}>{languageOptionLabel(code,fullLanguages,fallbackLabel)}</option>)}</select></div>;
}
