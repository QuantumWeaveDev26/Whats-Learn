const cfg=$("Resolve Settings").first().json.cfg;
// Meta calls this once when you save the webhook URL (GET with hub.mode, hub.verify_token, hub.challenge).
// Answer with hub.challenge only if the verify token matches the n8n environment variable WHATSAPP_VERIFY_TOKEN (16+ characters).
const raw=$input.first().json.query||{};
const q=(k)=>raw["hub."+k]!==undefined?raw["hub."+k]:(raw.hub&&raw.hub[k]);
const token=String(cfg.verifyToken||"");
const ok=q("mode")==="subscribe"&&token.length>=16&&String(q("verify_token")||"")===token;
return [{json:{ok,challenge:ok?String(q("challenge")||""):""}}];
