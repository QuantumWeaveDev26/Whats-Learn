import type {Mission} from './missions';
import * as marketing from './practical/marketing.json';
import * as development from './practical/development.json';
import * as filmmaking from './practical/filmmaking.json';
import * as storytelling from './practical/storytelling.json';
/**
 * v36 practical content, one file per course. Each entry adds the structured "try it" parts to a mission (`practical`).
 * Missions 4 to 10 of each course (and f3-style new ones) also get a sharper scenario question, options, explanation, task and checklist.
 * The ten older missions that have human-written Kannada and Hindi text only receive `practical`, so their translated question and task stay as they were.
 */
export type Overlay=Partial<Pick<Mission,'task'|'checks'|'question'|'options'|'answer'|'explanation'|'practical'>>;
// `import *` keeps this working both in the bundler and in the plain-Node tests; a bundler may add a `default` key, which is dropped here.
const own=(ns:object)=>Object.fromEntries(Object.entries(ns).filter(([k])=>k!=='default'));
export const practicalContent:Record<string,Overlay>={...own(marketing),...own(development),...own(filmmaking),...own(storytelling)} as unknown as Record<string,Overlay>;
