import type {Plugin} from 'vite';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
export function selectedLanguagePacks():Plugin{return {name:'whatslearn-selected-language',enforce:'pre',transform(_code,id){
 if(this.environment.name!=='client')return;
 const normalized=id.replaceAll('\\','/');
 if(normalized.endsWith('/lib/question-translations/index.ts'))return {code:readFileSync(fileURLToPath(new URL('../lib/question-translations/client.ts',import.meta.url)),'utf8'),map:null};
 if(!normalized.endsWith('/lib/translations/index.ts'))return;
 return {code:readFileSync(fileURLToPath(new URL('../lib/translations/client.ts',import.meta.url)),'utf8'),map:null};
}}}
