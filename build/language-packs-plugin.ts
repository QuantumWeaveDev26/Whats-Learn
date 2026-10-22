import type {Plugin} from 'vite';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
export function selectedLanguagePacks():Plugin{return {name:'whatslearn-selected-language',enforce:'pre',transform(_code,id){
 if(this.environment.name!=='client'||!id.replaceAll('\\','/').endsWith('/lib/translations/index.ts'))return;
 return {code:readFileSync(fileURLToPath(new URL('../lib/translations/client.ts',import.meta.url)),'utf8'),map:null};
}}}
