// Reads the five settings once per run. A value set on the n8n server (environment variable) wins; otherwise the value typed in the node 'My Settings (edit here)' is used.
// A value that still says PASTE... is treated as not set. Nothing secret is stored in this file.
const mine=$("My Settings (edit here)").first().json;
function fromEnv(name){try{const v=$env[name];return v===undefined||v===null?"":String(v).trim()}catch(e){return ""}}
function pick(envName,key){const e=fromEnv(envName);if(e)return e;const v=String(mine[key]===undefined?"":mine[key]).trim();return /PASTE/i.test(v)?"":v}
const cfg={
  verifyToken:pick("WHATSAPP_VERIFY_TOKEN","verifyToken"),
  appSecret:pick("WHATSAPP_APP_SECRET","appSecret"),
  baseUrl:pick("WHATSLEARN_BASE_URL","baseUrl").replace(/\/+$/,""),
  bridgeSecret:pick("WHATSLEARN_BRIDGE_SECRET","bridgeSecret"),
  phoneNumberId:pick("WHATSAPP_PHONE_NUMBER_ID","phoneNumberId")
};
return $input.all().map(i=>({json:{...i.json,cfg},binary:i.binary}));
