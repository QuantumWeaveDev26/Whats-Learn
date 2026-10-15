/**
 * Signs that pasted text is not a learner's own answer: server logs, terminal output, code or random letters.
 * Works on the device and on the server without any AI key. Plain sentences in any supported language pass.
 */
const LOG_LINE=[
 /^\s*\[[\w:.\- ]{2,40}\]/, // [wrangler:info], [vite], [2026-10-10 07:19:27]
 /\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\/\S*/, // GET /api/work
 /\b[1-5]\d\d\s+(OK|Created|No Content|Found|Not Modified|Bad Request|Unauthorized|Forbidden|Not Found|Method Not Allowed|Internal Server Error|Bad Gateway|Service Unavailable|Gateway Timeout)\b/i,
 /\(\d+(\.\d+)?\s?ms\)/, // (12ms)
 /\bhttps?:\/\/\S+/i,
 /\b(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?\b/i,
 /\b\d{4}-\d\d-\d\d[T ]\d\d:\d\d(:\d\d)?/, // timestamps
 /^\s*at\s+\S+\s+\(?[\w./\\:-]+:\d+:\d+\)?\s*$/, // stack frames
 /\b(wrangler|miniflare|workerd|vite|vinext|pnpm|npm|npx|node_modules|stderr|stdout|traceback|exception|errno|ECONNREFUSED|EADDRINUSE)\b/i,
 /^\s*(\$|>|PS [A-Z]:\\|[A-Z]:\\)\s?\S/, // shell prompts
 /^\s*(import|export|const|let|var|function|return|class|def|from|if|for|while)\b.*[;{}()=]\s*$/, // code
 /^\s*[{}[\]<>]|[{};]\s*$/, // JSON, HTML, code blocks
 /[─━│┃┌┐└┘├┤⎔⛅️▲✘✔✓]{1,}/u, // terminal drawing characters
];
export function machineLineShare(text:string){
 const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);if(!lines.length)return {lines:0,machine:0,share:0};
 const machine=lines.filter(l=>LOG_LINE.some(r=>r.test(l))).length;return {lines:lines.length,machine,share:machine/lines.length};
}
/** True for pasted logs, terminal output or code: most lines look machine-made, or the text is dense with symbols and numbers. */
export function looksLikeMachineText(text:string){
 const t=text.trim();if(!t)return false;
 const {lines,machine,share}=machineLineShare(t);
 if(machine>=2&&share>=0.4)return true;
 if(lines===1&&LOG_LINE.slice(0,3).some(r=>r.test(t))&&/\b\d{3}\b|\/\w/.test(t))return true;
 const letters=(t.match(/[\p{L}\p{M}]/gu)||[]).length,symbols=(t.match(/[^\p{L}\p{M}\p{N}\s.,!?'’"“”:;()\-–—।॥۔،]/gu)||[]).length,digits=(t.match(/\p{N}/gu)||[]).length;
 return t.length>=30&&(symbols+digits)/Math.max(1,letters+symbols+digits)>0.3;
}
/** True for keyboard mashing such as "asdf qwer zxcv" in Latin script. Other scripts are left to the topic check. */
export function looksLikeGibberish(text:string){
 const words=(text.toLowerCase().match(/[a-z]+/g)||[]).filter(w=>w.length>=3);if(words.length<3)return false;
 const odd=words.filter(w=>!/[aeiouy]/.test(w)||/[bcdfghjklmnpqrstvwxz]{5,}/.test(w)||/(.)\1{2,}/.test(w)||/^(asdf|qwer|zxcv|hjkl|jkl|sdf|wer|xcv)/.test(w)).length;
 return odd/words.length>=0.4;
}
