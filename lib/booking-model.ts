import {z} from 'zod';
export const bookingModelSchema=z.object({successWhen:z.enum(['request.sent','response.saved']),validatePhone:z.boolean(),rejectTakenSlot:z.boolean(),keepDraftOnFailure:z.boolean()}).strict();
export type BookingModel=z.infer<typeof bookingModelSchema>;
/** Executes a bounded declarative booking model. No eval, source execution, network, files or secrets. */
export function runBookingModel(raw:unknown){const model=bookingModelSchema.parse(raw),rows=new Set<string>();
 function run(name:string,phone:string,slot:string,mode:'ok'|'fail'|'network'='ok'){const messages:string[]=[];if(model.successWhen==='request.sent')messages.push('Booking saved');const status=mode==='network'?0:mode==='fail'?503:model.validatePhone&&(!name.trim()||!/^\d{10}$/.test(phone))?400:model.rejectTakenSlot&&rows.has(slot)?409:201;if(status===201){rows.add(slot);if(model.successWhen==='response.saved')messages.push('Booking saved')}else messages.push('Could not save');return {status,messages,rows:rows.size,draftKept:status===201||model.keepDraftOnFailure}}
 const tests:{name:string;passed:boolean;actual:unknown}[]=[];
 const success=run('Synthetic Parent','9999999999','09:00');tests.push({name:'Successful save confirms once',passed:success.status===201&&success.messages.length===1&&success.rows===1,actual:success});
 const fail=run('Synthetic Parent','9999999999','10:00','fail');tests.push({name:'503 never displays success or adds a row',passed:fail.status===503&&!fail.messages.includes('Booking saved')&&fail.rows===1,actual:fail});
 const duplicate=run('Synthetic Parent','9999999999','09:00');tests.push({name:'Duplicate slot rejected without another booking',passed:duplicate.status===409&&duplicate.rows===1,actual:duplicate});
 const invalid=run('','123','11:00');tests.push({name:'Invalid input rejected before storage',passed:invalid.status===400&&invalid.rows===1,actual:invalid});
 const network=run('Synthetic Parent','9999999999','12:00','network');tests.push({name:'Network failure keeps draft and no success',passed:network.draftKept&&!network.messages.includes('Booking saved')&&network.rows===1,actual:network});
 tests.push({name:'Pending response does not show success',passed:model.successWhen==='response.saved',actual:{messageBeforeResponse:model.successWhen==='request.sent'?'Booking saved':null}});
 return {suite:'booking-model-v1',scope:'Executed declarative model only; does not execute or verify an external project.',passed:tests.every(t=>t.passed),tests};}
export function bookingModelFromSubmission(text:string){const found=text.match(/BOOKING_MODEL_BEGIN\s*([\s\S]*?)\s*BOOKING_MODEL_END/);if(!found)return null;try{return runBookingModel(JSON.parse(found[1]))}catch{return {suite:'booking-model-v1',passed:false,scope:'Invalid model; no execution evidence.',tests:[]}}}
