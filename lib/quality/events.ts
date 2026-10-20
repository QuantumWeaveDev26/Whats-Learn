import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {database} from '@/lib/storage';
import {pruneQualityRecords} from './store';
const event=z.object({userId:z.string().min(1).max(128).optional(),channel:z.enum(['web','whatsapp']),category:z.enum(['evaluation_unavailable','mentor_unavailable','save_failed','whatsapp_send_failed','whatsapp_unknown']),correlationId:z.string().min(8).max(160).regex(/^[a-zA-Z0-9:_-]+$/)}).strict();
/** Best effort, allowlisted metadata only. Never store raw exceptions or provider payloads. */
export async function recordQualityEvent(input:unknown){try{const p=event.safeParse(input);if(!p.success)return;await pruneQualityRecords();await database().prepare('INSERT OR IGNORE INTO quality_events(id,user_id,channel,category,correlation_id,created_at) VALUES (?,?,?,?,?,?)').bind(randomUUID(),p.data.userId||null,p.data.channel,p.data.category,p.data.correlationId,new Date().toISOString()).run()}catch{}}
