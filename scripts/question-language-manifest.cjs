// Rebuild only after all versioned packs exist. Does not generate translations.
const fs=require('node:fs'),path=require('node:path');
const languages='kn hi te ta ml mr gu bn as pa or ur ne sa kok mai doi brx ks sd sat mni'.split(' ');
for(const lang of languages)for(const folder of ['question-translations','message-translations'])if(!fs.existsSync(path.join('lib',folder,lang+'.json')))throw Error('Missing '+folder+'/'+lang);
const imports=languages.map(l=>`import * as q_${l} from './${l}.json';\nimport * as c_${l} from '../message-translations/${l}.json';`).join('\n');
fs.writeFileSync('lib/question-translations/index.ts',`import type {QuestionPack} from './types';\nimport {englishCopy,type MessageCopy} from './copy';\n${imports}\nexport const questionPacks:Record<string,QuestionPack>={${languages.map(l=>l+':q_'+l).join(',')}};\nconst copies:Record<string,MessageCopy>={${languages.map(l=>l+':c_'+l).join(',')}};\nexport async function ensureQuestionPack(language:string){return language==='en'||!!questionPacks[language];}\nexport function questionText(language:string,id:string){return questionPacks[language]?.missions[id];}\nexport function messageCopy(language='en'):MessageCopy{return copies[language]||englishCopy;}\n`);
console.log('Question and message manifests: '+languages.length+' languages');
