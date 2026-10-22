import {projectConfig} from '@/lib/full-project';
import {env} from 'cloudflare:workers';
import {qualityOwner} from '@/lib/quality/access';
import {alertStatus} from '@/lib/quality/alerts';
import {aiReady} from '@/lib/ai-feedback';
import {whatsappConfig} from '@/lib/whatsapp';
export async function GET(){if(!await qualityOwner())return new Response('Not found',{status:404});try{const e=env as unknown as Record<string,string|undefined>,wa=whatsappConfig();return Response.json({checkedAt:new Date().toISOString(),ai:{configured:aiReady()},alerts:await alertStatus(),sandbox:{configured:projectConfig().ready,activationRequires:['FULL_PROJECT_SERVICE_URL','FULL_PROJECT_SERVICE_TOKEN','FULL_PROJECT_DAILY_LIMIT']},whatsapp:{bridgeConfigured:!!e.N8N_BRIDGE_SECRET,templateConfigured:!!(wa.performanceTemplate||wa.progressTemplate||e.WHATSAPP_PERFORMANCE_TEMPLATES),approvalVerified:false}},{headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}})}catch{return Response.json({error:'Service status unavailable.'},{status:503})}}
