const cfg=$("Resolve Settings").first().json.cfg;
// Pure JavaScript HMAC-SHA256, so this node needs no extra n8n server setting.
const wlBytes=s=>{if(typeof s!=="string")return s;const o=[];for(let i=0;i<s.length;i++){let c=s.charCodeAt(i);if(c>=0xd800&&c<0xe000){const d=i+1<s.length?s.charCodeAt(i+1):0;if(c<0xdc00&&d>=0xdc00&&d<0xe000){c=0x10000+((c-0xd800)<<10)+(d-0xdc00);i++}else c=0xfffd}
if(c<0x80)o.push(c);else if(c<0x800)o.push(0xc0|c>>6,0x80|c&63);else if(c<0x10000)o.push(0xe0|c>>12,0x80|c>>6&63,0x80|c&63);else o.push(0xf0|c>>18,0x80|c>>12&63,0x80|c>>6&63,0x80|c&63)}return Uint8Array.from(o)};
const wlSha=m=>{const P=[];for(let n=2;P.length<64;n++)if(P.every(p=>n%p))P.push(n);
const fr=x=>Math.floor((x-Math.floor(x))*4294967296)>>>0;const K=P.map(p=>fr(Math.pow(p,1/3)));const H=P.slice(0,8).map(p=>fr(Math.sqrt(p)));
const l=m.length,n=((l+9+63)>>6)<<6,b=new Uint8Array(n);b.set(m);b[l]=0x80;const hi=Math.floor(l/0x20000000),lo=(l<<3)>>>0;
[hi,lo].forEach((v,k)=>{for(let j=0;j<4;j++)b[n-8+k*4+j]=(v>>>(24-8*j))&255});
const w=new Array(64),r=(x,k)=>(x>>>k)|(x<<(32-k));
for(let o=0;o<n;o+=64){for(let i=0;i<16;i++)w[i]=((b[o+4*i]<<24)|(b[o+4*i+1]<<16)|(b[o+4*i+2]<<8)|b[o+4*i+3])>>>0;
for(let i=16;i<64;i++){const a=w[i-15],c=w[i-2];w[i]=(w[i-16]+(r(a,7)^r(a,18)^(a>>>3))+w[i-7]+(r(c,17)^r(c,19)^(c>>>10)))>>>0}
let [a,c,d,e,f,g,h,i2]=H;
for(let i=0;i<64;i++){const t1=(i2+(r(f,6)^r(f,11)^r(f,25))+((f&g)^(~f&h))+K[i]+w[i])>>>0,t2=((r(a,2)^r(a,13)^r(a,22))+((a&c)^(a&d)^(c&d)))>>>0;i2=h;h=g;g=f;f=(e+t1)>>>0;e=d;d=c;c=a;a=(t1+t2)>>>0}
[a,c,d,e,f,g,h,i2].forEach((v,i)=>{H[i]=(H[i]+v)>>>0})}
const out=new Uint8Array(32);H.forEach((v,i)=>{for(let j=0;j<4;j++)out[4*i+j]=(v>>>(24-8*j))&255});return out};
const wlHmacHex=(key,msg)=>{let k=wlBytes(key);if(k.length>64)k=wlSha(k);const ip=new Uint8Array(64).fill(0x36),op=new Uint8Array(64).fill(0x5c);for(let i=0;i<k.length;i++){ip[i]^=k[i];op[i]^=k[i]}
const m=wlBytes(msg),a=new Uint8Array(64+m.length);a.set(ip);a.set(m,64);const inner=wlSha(a),b=new Uint8Array(96);b.set(op);b.set(inner,64);return Array.from(wlSha(b),x=>("0"+x.toString(16)).slice(-2)).join("")};
const wlSame=(a,b)=>{if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0};
const wlNonce=()=>{let s="";for(let i=0;i<32;i++)s+=Math.floor(Math.random()*16).toString(16);return s};
const base=String(cfg.baseUrl||"").replace(/\/+$/,"");
const secret=String(cfg.bridgeSecret||"");
if(!/^https:\/\//.test(base)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(base))throw new Error("Open node 'My Settings (edit here)' and fill in baseUrl (the https address of the site), or set WHATSLEARN_BASE_URL on the n8n server.");
if(secret.length<32)throw new Error("Open node 'My Settings (edit here)' and fill in bridgeSecret (32+ characters, same as N8N_BRIDGE_SECRET on the website), or set WHATSLEARN_BRIDGE_SECRET on the n8n server.");
function sign(path,payload){
  const body=JSON.stringify(payload);
  const ts=String(Math.floor(Date.now()/1000));
  const nonce=wlNonce();
  const signature=wlHmacHex(secret,ts+"\n"+nonce+"\nPOST\n"+path+"\n"+body);
  return {url:base+path,body,ts,nonce,signature};
}
// Ask WhatsLearn for website notices that have not been sent yet.
return [{json:sign("/api/bridge/whatsapp/outbox",{action:"claim",limit:20})}];
