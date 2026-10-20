import {z} from 'zod';
import {bridge} from '@/lib/bridge/auth';
import {receiveStatusWebhook,StatusSignatureError} from '@/lib/bridge/reminder-delivery';
const input=z.object({metaRawBody:z.string().max(400000),metaSignature:z.string().max(100)}).strict();
export async function POST(request:Request){return bridge(request,async raw=>{const p=input.safeParse(raw);if(!p.success)return {status:400,json:{error:'Invalid status receipt.'}};try{return {status:200,json:await receiveStatusWebhook(p.data.metaRawBody,p.data.metaSignature)}}catch(e){return {status:e instanceof StatusSignatureError?401:400,json:{error:'Status receipt could not be verified.'}}}})}
