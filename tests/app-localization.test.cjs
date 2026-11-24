const test=require('node:test');
const assert=require('node:assert/strict');
const {readdirSync,readFileSync}=require('node:fs');
const path=require('node:path');

const directory=path.join(__dirname,'../components/whatslearn-app/copy');
const languages=['bn','gu','hi','kn','ml','mni','mr','or','pa','sa','ta','te'];
const templates=text=>(text.match(/\{\d+\}/g)||[]).sort().join();

test('app translation packs cover each supported language and preserve template values',()=>{
 assert.deepEqual(readdirSync(directory).filter(name=>name.endsWith('.json')).map(name=>name.slice(0,-5)).sort(),languages);
 for(const language of languages){
  const copy=JSON.parse(readFileSync(path.join(directory,language+'.json'),'utf8'));
  for(const key of ['Dino break','Start game','Sign in to WhatsLearn','Continue learning','Reference order','Try it in your own work:']){
   assert.ok(copy[key]&&copy[key]!==key,language+' missing '+key);
  }
  for(const [text,translation] of Object.entries(copy)){
   assert.equal(typeof translation,'string',language+' '+text);
   assert.equal(templates(translation),templates(text),language+' '+text);
  }
 }
});

test('switching languages selects that language’s copy and interpolates the same counts',async()=>{
 const {hooks,load}=require('./helpers/client-components.cjs');
 const session=hooks();
 const modules=new Map();
 const overrides=Object.fromEntries(languages.map(language=>[
  './copy/'+language+'.json',{__esModule:true,default:JSON.parse(readFileSync(path.join(directory,language+'.json'),'utf8'))}
 ]));
 const copy=load(path.join('components','whatslearn-app','app-copy.ts'),session,overrides,modules);
 const {appTranslator}=load(path.join('components','whatslearn-app','app-language.ts'),session,overrides,modules);
 const label='Reference order';
 assert.equal(appTranslator('en')(label),label);
 for(const language of languages){
  assert.equal(await copy.loadAppCopy(language),true);
  assert.notEqual(appTranslator(language)(label),label,language);
  const position=appTranslator(language)('Line {0}: {1}',[379,'detected issue']);
  assert.ok(position.includes('379')&&position.includes('detected issue'),language);
  assert.doesNotMatch(position,/\{\d+\}/,language);
 }
 assert.equal(appTranslator('en')(label),label);
});
