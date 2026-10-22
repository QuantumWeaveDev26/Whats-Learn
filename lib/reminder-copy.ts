import {messageCopy} from './question-translations';
import {env} from 'cloudflare:workers';
type Template={name:string;language:string;kind:'progress'|'performance'};
export function performanceTemplate(language:string):Template|null{
 const e=env as unknown as Record<string,string|undefined>;let map:Record<string,Template>={};try{map=JSON.parse(e.WHATSAPP_PERFORMANCE_TEMPLATES||'{}')}catch{}
 const mapped=map?.[language];if(mapped&&/^[a-z0-9_]{1,512}$/.test(mapped.name||'')&&String(mapped.language||'').split(/[_-]/)[0]===language&&['progress','performance'].includes(mapped.kind))return mapped;
 const metaLanguage=e.WHATSAPP_TEMPLATE_LANGUAGE||'en';if(metaLanguage.split(/[_-]/)[0]!==language)return null;
 if(e.WHATSAPP_PROGRESS_TEMPLATE)return {name:e.WHATSAPP_PROGRESS_TEMPLATE,language:metaLanguage,kind:'progress'};
 return e.WHATSAPP_PERFORMANCE_TEMPLATE?{name:e.WHATSAPP_PERFORMANCE_TEMPLATE,language:metaLanguage,kind:'performance'}:null;
}
export function reminderCopy(language:string){const t=messageCopy(language);return {paused:t.paused,stopped:t.stopped,resumed:t.resumed,progress:t.progress,saved:t.savedCount,next:t.next,today:t.today,streak:t.streak,week:t.week,pause:t.pause,fallback:['mni','sat'].includes(language)?'English guidance — selected-language translation pending.':''};}
