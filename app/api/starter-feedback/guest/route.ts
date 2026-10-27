import {z} from 'zod';
import {env} from 'cloudflare:workers';
import {sameOrigin} from '@/lib/storage';
import {aiReady,FeedbackError,reviewStarterAnswer} from '@/lib/ai-feedback';
import {agencyStory,agencyTracks} from '@/lib/agency-story';
import {checkStarter} from '@/lib/starter-check';
import {languageCodes} from '@/lib/languages';
import {allow,clientAddress} from '@/lib/auth/limits';
const input=z.object({track:z.enum(['marketing','development','filmmaking','storytelling']),body:z.string().min(10).max(400),language:z.enum(languageCodes)}).strict();
/** One AI review per visitor per day for the free starter, with a site-wide daily cap. Nothing is saved. */
export async function POST(request:Request){const out=(d:unknown,status=200)=>Response.json(d,{status,headers:{'Cache-Control':'no-store'}});if(!sameOrigin(request))return out({error:'Invalid origin.'},403);try{if(!aiReady())return out({error:'AI feedback is unavailable right now.'},503);const raw=await request.text();if(raw.length>2000)return out({error:'Request too large.'},413);const p=input.parse(JSON.parse(raw)),index=agencyTracks.findIndex(t=>t.id===p.track),task=agencyStory('en',p.track).copy.tasks[index],check=checkStarter(p.track,p.body,task);if(!check.ok)return out({error:check.message},422);const cap=Number((env as unknown as Record<string,string|undefined>).GUEST_STARTER_DAILY_LIMIT||200);if(!await allow('guest-starter',clientAddress(request),1,86400))return out({error:'You have used today’s free AI review. Sign in for more.'},429);if(!await allow('guest-starter-all','all',cap,86400))return out({error:'Free AI reviews are busy today. Sign in for AI feedback.'},429);const feedback=await reviewStarterAnswer(task,p.body,p.language);return out({feedback})}catch(e){if(e instanceof FeedbackError)return out({error:e.message},e.status);if(e instanceof z.ZodError||e instanceof SyntaxError)return out({error:'Check your starter answer.'},400);return out({error:'AI feedback is unavailable right now.'},503)}}
