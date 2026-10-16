const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
const source=fs.readFileSync('lib/languages.ts','utf8');
const output={exports:{}};
new Function('exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(output.exports);
const {languages,languageOptions,languageCodes}=output.exports;

test('language menus prioritise English, Hindi, Kannada, then remaining southern languages',()=>{
 assert.deepEqual(Object.keys(languages).slice(0,6),['en','hi','kn','ta','te','ml']);
 assert.deepEqual(Object.keys(languageOptions()).slice(0,6),['en','hi','kn','ta','te','ml']);
 assert.deepEqual(languageCodes.slice(0,6),['en','hi','kn','ta','te','ml']);
});

test('priority keeps all 23 languages and places northern choices after the southern ones',()=>{
 assert.equal(languageCodes.length,23);
 assert.equal(new Set(languageCodes).size,23);
 for(const code of ['pa','ur','ks','doi','sd','sa','ne','mai'])assert.ok(languageCodes.indexOf(code)>languageCodes.indexOf('ml'));
 assert.deepEqual([...languageCodes].sort(),['en','as','bn','brx','doi','gu','hi','kn','ks','kok','mai','ml','mni','mr','ne','or','pa','sa','sat','sd','ta','te','ur'].sort());
});
