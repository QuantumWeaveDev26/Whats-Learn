import type {Mission} from '../missions';
/** A machine-drafted lesson pack. Every pack needs native-speaker review before it is called final. */
export type LessonText=Pick<Mission,'title'|'brief'|'lesson'|'example'|'task'|'checks'|'question'|'options'|'explanation'>;
export type LanguagePack={
 /** false until a native speaker has reviewed the pack. */
 reviewed:boolean;
 missions:Record<string,LessonText>;
 /** Mini side quest per mission: [question, option A, option B, why]. */
 mini:Record<string,[string,string,string,string]>;
 outcome:{job:string;switch:string;upskill:string;team:string};
 challenge:{mini:string;stretch:string};
 labels:{tag:string;retry:string;save:string;saved:string;hint:string};
 placeholder:string;
};
