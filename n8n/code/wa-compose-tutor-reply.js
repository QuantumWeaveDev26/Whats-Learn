const cfg=$("Resolve Settings").first().json.cfg;
// Turn OpenAI's answer into a short WhatsApp message. Any error or empty answer sends WhatsLearn's own fallback text instead.
const priors=$("Build Tutor Request").all();
return $input.all().map((it,i)=>{
const prior=priors[i].json;
const res=it.json||{};
let text=String((res.choices&&res.choices[0]&&res.choices[0].message&&res.choices[0].message.content)||"").trim();
if(res.error||!text)text=prior.fallback;
else{
  let host="";try{host=new URL(String(cfg.baseUrl||"")).hostname}catch(e){}
  text=text.replace(/https?:\/\/\S+/g,u=>{try{return host&&new URL(u).hostname===host?u:""}catch(e){return ""}}).replace(/[ \t]+\n/g,"\n").trim();
  const words=text.split(/\s+/);
  if(words.length>Math.ceil(prior.maxWords*1.5))text=words.slice(0,prior.maxWords).join(" ")+"…";
  if(!text)text=prior.fallback;
}
const name=String(prior.addressAs||'').replace(/[\r\n*_~`<>]/g,' ').replace(/\s+/g,' ').trim().slice(0,60);
const nameWords=value=>' '+value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()+' ';
if(name&&!name.includes('@')&&!nameWords(text).includes(nameWords(name)))text=name+', '+text;
return {json:{reply:text.slice(0,1500)},pairedItem:{item:i}};
});
