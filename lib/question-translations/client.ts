import type {QuestionPack} from './types';
import {englishCopy,type MessageCopy} from './copy';
export const questionPacks:Record<string,QuestionPack>={};
const copies:Record<string,MessageCopy>={};
const loaders:Record<string,()=>Promise<[QuestionPack,MessageCopy]>>={
kn:async()=>{const [q,c]=await Promise.all([import('./kn.json'),import('../message-translations/kn.json')]);return [q.default,c.default]},
hi:async()=>{const [q,c]=await Promise.all([import('./hi.json'),import('../message-translations/hi.json')]);return [q.default,c.default]},
te:async()=>{const [q,c]=await Promise.all([import('./te.json'),import('../message-translations/te.json')]);return [q.default,c.default]},
ta:async()=>{const [q,c]=await Promise.all([import('./ta.json'),import('../message-translations/ta.json')]);return [q.default,c.default]},
ml:async()=>{const [q,c]=await Promise.all([import('./ml.json'),import('../message-translations/ml.json')]);return [q.default,c.default]},
mr:async()=>{const [q,c]=await Promise.all([import('./mr.json'),import('../message-translations/mr.json')]);return [q.default,c.default]},
gu:async()=>{const [q,c]=await Promise.all([import('./gu.json'),import('../message-translations/gu.json')]);return [q.default,c.default]},
bn:async()=>{const [q,c]=await Promise.all([import('./bn.json'),import('../message-translations/bn.json')]);return [q.default,c.default]},
as:async()=>{const [q,c]=await Promise.all([import('./as.json'),import('../message-translations/as.json')]);return [q.default,c.default]},
pa:async()=>{const [q,c]=await Promise.all([import('./pa.json'),import('../message-translations/pa.json')]);return [q.default,c.default]},
or:async()=>{const [q,c]=await Promise.all([import('./or.json'),import('../message-translations/or.json')]);return [q.default,c.default]},
ur:async()=>{const [q,c]=await Promise.all([import('./ur.json'),import('../message-translations/ur.json')]);return [q.default,c.default]},
ne:async()=>{const [q,c]=await Promise.all([import('./ne.json'),import('../message-translations/ne.json')]);return [q.default,c.default]},
sa:async()=>{const [q,c]=await Promise.all([import('./sa.json'),import('../message-translations/sa.json')]);return [q.default,c.default]},
kok:async()=>{const [q,c]=await Promise.all([import('./kok.json'),import('../message-translations/kok.json')]);return [q.default,c.default]},
mai:async()=>{const [q,c]=await Promise.all([import('./mai.json'),import('../message-translations/mai.json')]);return [q.default,c.default]},
doi:async()=>{const [q,c]=await Promise.all([import('./doi.json'),import('../message-translations/doi.json')]);return [q.default,c.default]},
brx:async()=>{const [q,c]=await Promise.all([import('./brx.json'),import('../message-translations/brx.json')]);return [q.default,c.default]},
ks:async()=>{const [q,c]=await Promise.all([import('./ks.json'),import('../message-translations/ks.json')]);return [q.default,c.default]},
sd:async()=>{const [q,c]=await Promise.all([import('./sd.json'),import('../message-translations/sd.json')]);return [q.default,c.default]},
sat:async()=>{const [q,c]=await Promise.all([import('./sat.json'),import('../message-translations/sat.json')]);return [q.default,c.default]},
mni:async()=>{const [q,c]=await Promise.all([import('./mni.json'),import('../message-translations/mni.json')]);return [q.default,c.default]},
};
const pending=new Map<string,Promise<boolean>>();
export function ensureQuestionPack(language:string):Promise<boolean>{if(language==='en'||questionPacks[language])return Promise.resolve(true);const old=pending.get(language);if(old)return old;const load=loaders[language];if(!load)return Promise.resolve(false);const task=load().then(([q,c])=>{questionPacks[language]=q;copies[language]=c;return true}).finally(()=>pending.delete(language));pending.set(language,task);return task;}
export function questionText(language:string,id:string){return questionPacks[language]?.missions[id];}
export function messageCopy(language='en'):MessageCopy{return copies[language]||englishCopy;}
