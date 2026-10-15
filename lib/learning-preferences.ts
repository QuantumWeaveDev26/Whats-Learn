export type LearningPreferences={mode:string;format:string;supportLanguage:string;reminders:boolean;celebrations:boolean;name:string};
export const defaultPreferences:LearningPreferences={mode:'adaptive',format:'challenge',supportLanguage:'none',reminders:false,celebrations:true,name:''};
export function readPreferences():LearningPreferences{try{return {...defaultPreferences,...JSON.parse(localStorage.getItem('whatslearn-preferences')||'{}')}}catch{return defaultPreferences}}
export function savePreferences(value:LearningPreferences){localStorage.setItem('whatslearn-preferences',JSON.stringify(value))}
