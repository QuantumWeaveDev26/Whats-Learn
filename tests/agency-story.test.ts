import assert from 'node:assert/strict';
import {agencyStory,agencyStoryLanguages,agencyTracks,readAgencyDrafts,saveAgencyDraft} from '../lib/agency-story';
import {languages,languageCodes,lessonLanguage,lessonLanguages,languageDirection,readPreferredLanguage,rememberLanguage} from '../lib/languages';
import {learningPath} from '../lib/learning-engine';
import {defaultProfile} from '../lib/personalization';
const values=new Map<string,string>();
Object.defineProperty(globalThis,'localStorage',{value:{getItem:(key:string)=>values.get(key)||null,setItem:(key:string,value:string)=>values.set(key,value)}});
Object.defineProperty(globalThis,'window',{value:{dispatchEvent:()=>true}});
assert.equal(languageCodes.length,23);assert.equal(new Set(languageCodes).size,23);assert.equal(languageCodes[0],'en');
assert.equal(readPreferredLanguage(),'en');
for(const code of languageCodes){rememberLanguage(code);assert.equal(readPreferredLanguage(),code);assert.ok(languages[code]);const story=agencyStory(code);assert.equal(story.contentLanguage,story.translated?code:'en');const path=learningPath({...defaultProfile,language:code},[]);assert.equal(path.profile.language,code);assert.equal(path.contentLanguage,lessonLanguage(code));assert.equal(path.translationAvailable,lessonLanguages.includes(code));assert.equal(lessonLanguages.length,23,'Every listed language has a lesson pack (20 are drafts)');}
values.set('whatslearn-language','invalid');assert.equal(readPreferredLanguage('kn'),'kn');assert.throws(()=>rememberLanguage('invalid'));
assert.equal(languageDirection('ur'),'rtl');assert.equal(languageDirection('ks'),'rtl');assert.equal(languageDirection('kn'),'ltr');
assert.equal(agencyStoryLanguages.length,14);
for(const code of agencyStoryLanguages){const s=agencyStory(code);assert.ok(s.translated);assert.equal(s.copy.options.length,2);assert.equal(s.copy.tasks.length,4);assert.ok(s.copy.story.length>20);assert.ok(s.copy.tasks.every(t=>t.length>15));}
assert.equal(new Set(agencyTracks.map(t=>t.mission)).size,4,'Film and visual storytelling keep different mission routes');
const draft={body:'Our launch needs a clear audience and next action.',choice:0,language:'kn',updatedAt:'2026-10-06T07:00:00Z'};
values.set('whatslearn-visual-warmup',JSON.stringify({body:'An old cafe creation',choice:'B'}));assert.deepEqual(readAgencyDrafts(),{},'Old café work is not relabelled as agency work');
saveAgencyDraft('marketing',draft);saveAgencyDraft('filmmaking',{...draft,language:'hi'});assert.equal(Object.keys(readAgencyDrafts()).length,2);
saveAgencyDraft('marketing',{...draft,body:'An improved campaign hook with a clear next action.'});assert.equal(Object.keys(readAgencyDrafts()).length,2,'A revision replaces the starter piece');
assert.throws(()=>saveAgencyDraft('marketing',{...draft,choice:1}));assert.throws(()=>saveAgencyDraft('marketing',{...draft,language:'invalid'}));assert.throws(()=>saveAgencyDraft('marketing',{...draft,body:' '}));
values.set('whatslearn-agency-warmups-v1','invalid json');assert.deepEqual(readAgencyDrafts(),{});
console.log('Agency starter: language persistence, explicit translation fallback, separate programme routes and saved-work validation passed.');
