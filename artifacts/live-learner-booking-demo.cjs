// Synthetic WhatsLearn learner trial. No real parent data, no external service.
const http=require('node:http');
const assert=require('node:assert/strict');
const bookings=new Map();
const server=http.createServer(async(req,res)=>{
 let raw='';for await(const chunk of req)raw+=chunk;
 const b=JSON.parse(raw||'{}');const send=(status,data)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(data))};
 if(!b.name?.trim()||!/^\d{10}$/.test(b.phone||'')||!b.slot)return send(400,{error:'Check name, phone and slot'});
 if(b.fail)return send(503,{error:'Could not save. Try again.'});
 if(bookings.has(b.slot))return send(409,{error:'Slot taken. Choose another.'});
 bookings.set(b.slot,{name:b.name,phone:b.phone});return send(201,{saved:true});
});
async function client(payload,fixed){const messages=[];if(!fixed)messages.push('Booking saved');const r=await fetch(base,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});const data=await r.json();if(fixed&&r.ok&&data.saved)messages.push('Booking saved');if(!r.ok)messages.push(data.error);return {status:r.status,messages}}
let base;
server.listen(0,'127.0.0.1',async()=>{base='http://127.0.0.1:'+server.address().port;try{
 const parent={name:'Synthetic Test Parent',phone:'9000000000',slot:'Monday 6pm'};
 const weak=await client({...parent,fail:true},false);assert.deepEqual(weak.messages,['Booking saved','Could not save. Try again.']);console.log('WEAK forced failure:',JSON.stringify(weak),'rows='+bookings.size);
 const ok=await client(parent,true);assert.equal(ok.status,201);assert.deepEqual(ok.messages,['Booking saved']);console.log('FIXED success:',JSON.stringify(ok),'rows='+bookings.size);
 const fail=await client({...parent,slot:'Tuesday 6pm',fail:true},true);assert.equal(fail.status,503);assert.deepEqual(fail.messages,['Could not save. Try again.']);assert.equal(bookings.size,1);console.log('FIXED forced failure:',JSON.stringify(fail),'rows='+bookings.size);
 const taken=await client(parent,true);assert.equal(taken.status,409);console.log('FIXED slot taken:',JSON.stringify(taken),'rows='+bookings.size);
 const invalid=await client({...parent,name:'',phone:'123',slot:'Wednesday 6pm'},true);assert.equal(invalid.status,400);assert.equal(bookings.size,1);console.log('FIXED invalid input:',JSON.stringify(invalid),'rows='+bookings.size);
 console.log('PASS: no success on failure; successful request stored once; invalid/duplicate submissions add no rows. Phone retained only in server-side Map; never returned to clients.');
 }catch(e){console.error(e);process.exitCode=1}finally{server.close()}});
