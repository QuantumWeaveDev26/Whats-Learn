import type {LanguagePack} from './types';
export const languagePacks:Record<string,LanguagePack>={};
const loaders:Record<string,()=>Promise<{default:LanguagePack}>>={
 as:()=>import('./as'),
 bn:()=>import('./bn'),
 brx:()=>import('./brx'),
 doi:()=>import('./doi'),
 gu:()=>import('./gu'),
 ks:()=>import('./ks'),
 kok:()=>import('./kok'),
 mai:()=>import('./mai'),
 ml:()=>import('./ml'),
 mni:()=>import('./mni'),
 mr:()=>import('./mr'),
 ne:()=>import('./ne'),
 or:()=>import('./or'),
 pa:()=>import('./pa'),
 sa:()=>import('./sa'),
 sat:()=>import('./sat'),
 sd:()=>import('./sd'),
 ta:()=>import('./ta'),
 te:()=>import('./te'),
 ur:()=>import('./ur'),
};
const pending=new Map<string,Promise<boolean>>();
export function ensureLanguagePack(language:string):Promise<boolean>{
 if(languagePacks[language]||['en','kn','hi'].includes(language))return Promise.resolve(true);
 const load=loaders[language];if(!load)return Promise.resolve(false);
 const old=pending.get(language);if(old)return old;
 const task=load().then(pack=>{languagePacks[language]=pack.default;return true}).finally(()=>pending.delete(language));pending.set(language,task);return task;
}
