'use client';
/** Share cards and course certificates are drawn on the phone, then handed to the share sheet (or downloaded). */
const APP_URL='https://whatslearn.in/app';
const G='#125C43',MINT='#D5F4DE',INK='#16241D',MUT='#4E655A';

function wrap(ctx:CanvasRenderingContext2D,text:string,max:number,lines:number){
 const words=text.replace(/\s+/g,' ').trim().split(' ');const out:string[]=[];let line='';
 for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width>max&&line){out.push(line);line=w;if(out.length===lines)break}else line=t}
 if(out.length<lines&&line)out.push(line);
 if(out.length===lines&&words.join(' ').length>out.join(' ').length){let last=out[lines-1];while(ctx.measureText(last+'…').width>max&&last.length)last=last.slice(0,-1);out[lines-1]=last.trimEnd()+'…'}
 return out;
}
function logo():Promise<HTMLImageElement|null>{return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='/images/app-icon-192.png'})}
function round(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
const font=(px:number,weight=600)=>`${weight} ${px}px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif`;

async function deliver(canvas:HTMLCanvasElement,name:string,text:string){
 const blob=await new Promise<Blob|null>(r=>canvas.toBlob(r,'image/png'));if(!blob)return 'failed';
 const file=new File([blob],name,{type:'image/png'});
 try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],text:`${text} ${APP_URL}`});return 'shared'}}
 catch(e){if(e instanceof DOMException&&e.name==='AbortError')return 'cancelled'}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
 return 'downloaded';
}

/** A square card with the learner's own answer and what the AI liked about it. */
export async function shareStarterCard(skill:string,answer:string,worked:string){
 const c=document.createElement('canvas');c.width=1080;c.height=1080;const x=c.getContext('2d');if(!x)return 'failed';
 x.fillStyle=G;x.fillRect(0,0,1080,1080);
 x.fillStyle='#fff';round(x,60,60,960,960,48);x.fill();
 const l=await logo();if(l)x.drawImage(l,110,110,84,84);
 x.fillStyle=INK;x.font=font(34,700);x.fillText('WhatsLearn',214,150);x.fillStyle=MUT;x.font=font(26,500);x.fillText('From chat to change',214,186);
 x.fillStyle=G;x.font=font(30,700);x.fillText(`MY AI ${skill.toUpperCase()} ANSWER`,110,290);
 x.fillStyle=INK;x.font=font(46,600);let y=360;for(const ln of wrap(x,`“${answer}”`,860,5)){x.fillText(ln,110,y);y+=62}
 y+=30;x.fillStyle=MINT;round(x,110,y,860,230,28);x.fill();
 x.fillStyle=G;x.font=font(28,700);x.fillText('WHAT THE AI LIKED',150,y+60);
 x.fillStyle=INK;x.font=font(32,500);let yy=y+110;for(const ln of wrap(x,worked,780,3)){x.fillText(ln,150,yy);yy+=44}
 x.fillStyle=MUT;x.font=font(30,600);x.fillText('Try a free 3-minute AI task → whatslearn.in/app',110,975);
 return deliver(c,'whatslearn-answer.png','I tried a free AI skills task on WhatsLearn.');
}

/** A landscape certificate for finishing all 10 tasks of a course. */
export async function shareCertificate(name:string,course:string,date=new Date()){
 const c=document.createElement('canvas');c.width=1600;c.height=1130;const x=c.getContext('2d');if(!x)return 'failed';
 x.fillStyle='#F6FAF6';x.fillRect(0,0,1600,1130);
 x.strokeStyle=G;x.lineWidth=14;round(x,40,40,1520,1050,36);x.stroke();
 x.strokeStyle=MINT;x.lineWidth=4;round(x,72,72,1456,986,26);x.stroke();
 const l=await logo();if(l)x.drawImage(l,740,120,120,120);
 x.textAlign='center';
 x.fillStyle=G;x.font=font(30,700);x.fillText('CERTIFICATE OF COMPLETION',800,310);
 x.fillStyle=MUT;x.font=font(34,500);x.fillText('This certifies that',800,400);
 x.fillStyle=INK;x.font=font(84,700);x.fillText(wrap(x,name||'A WhatsLearn learner',1300,1)[0],800,510);
 x.fillStyle=MUT;x.font=font(34,500);x.fillText('completed all 10 practical tasks of',800,600);
 x.fillStyle=G;x.font=font(58,700);x.fillText(wrap(x,course,1300,1)[0],800,690);
 x.fillStyle=MUT;x.font=font(30,500);x.fillText('Each task was real work, reviewed with AI feedback.',800,770);
 x.fillStyle=INK;x.font=font(32,600);x.fillText(date.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}),800,900);
 x.fillStyle=MUT;x.font=font(26,500);x.fillText('WhatsLearn · A venture of BrandMint AI Pvt. Ltd. · whatslearn.in',800,980);
 return deliver(c,`whatslearn-certificate-${course.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.png`,`I completed ${course} on WhatsLearn!`);
}
