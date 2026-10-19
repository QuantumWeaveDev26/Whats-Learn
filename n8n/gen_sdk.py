#!/usr/bin/env python3
"""Builds the n8n Workflow SDK source for the three WhatsLearn workflows from n8n/code/*.js. Prints TypeScript to stdout: python3 n8n/gen_sdk.py 1|2|3"""
import json,sys,os,re
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'code')
def js(name): return json.dumps(open(os.path.join(D,name)).read().rstrip('\n'))
HEAD="import { workflow, node, trigger, ifElse, switchCase, splitInBatches, nextBatch, newCredential, expr, nodeJson } from '@n8n/workflow-sdk';\n"
def code(var,name,file,pos,out="{ ok: true }"):
    return f"""const {var} = node({{ type: 'n8n-nodes-base.code', version: 2, config: {{ name: '{name}', parameters: {{ mode: 'runOnceForAllItems', language: 'javaScript', jsCode: {js(file)} }}, position: {pos} }}, output: [{out}] }});\n"""
HTTP_HEADERS="""headerParameters: { parameters: [ { name: 'x-wl-timestamp', value: expr('{{ $json.ts }}') }, { name: 'x-wl-nonce', value: expr('{{ $json.nonce }}') }, { name: 'x-wl-signature', value: expr('{{ $json.signature }}') } ] }"""
def signed_http(var,name,pos,extra_cfg="",out="{ ok: true }"):
    return f"""const {var} = node({{ type: 'n8n-nodes-base.httpRequest', version: 4.4, config: {{ name: '{name}', parameters: {{ method: 'POST', url: expr('{{{{ $json.url }}}}'), sendHeaders: true, specifyHeaders: 'keypair', {HTTP_HEADERS}, sendBody: true, contentType: 'raw', rawContentType: 'application/json', body: expr('{{{{ $json.body }}}}'), options: {{ timeout: 30000 }} }}, retryOnFail: true, maxTries: 3, waitBetweenTries: 2000, {extra_cfg} position: {pos} }}, output: [{out}] }});\n"""
WA_CRED="credentials: { httpHeaderAuth: newCredential('Meta WhatsApp token (Header Auth)') }"
GRAPH_URL="expr(`{{ 'https://graph.facebook.com/v20.0/' + $(\"Resolve Settings\").first().json.cfg.phoneNumberId + '/messages' }}`)"
def _js(e):
    # turn an SDK expression like expr('{{ $json.text }}') or nodeJson(splitMessages, 'from') into a plain JS expression
    if e.startswith("nodeJson("): return "$('One Item Per Message').item.json.from"
    m=re.match(r"expr\('\{\{ (.*) \}\}'\)$",e)
    return m.group(1) if m else e
def wa_text(var,name,to_expr,text_expr,pos,cfg=""):
    body="{{ JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: String("+_js(to_expr)+").replace(/[^0-9]/g, ''), type: 'text', text: { body: String("+_js(text_expr)+").slice(0, 3800) } }) }}"
    return f"""const {var} = node({{ type: 'n8n-nodes-base.httpRequest', version: 4.4, config: {{ name: '{name}', parameters: {{ method: 'POST', url: {GRAPH_URL}, authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr(`{body}`), options: {{ timeout: 20000 }} }}, {WA_CRED}, {cfg} position: {pos} }}, output: [{{ messages: [{{ id: 'wamid.mock' }}] }}] }});\n"""
def ifbool(var,name,field,pos):
    return f"""const {var} = ifElse({{ version: 2.3, config: {{ name: '{name}', parameters: {{ conditions: {{ options: {{ caseSensitive: true, leftValue: '', typeValidation: 'strict' }}, conditions: [ {{ leftValue: expr('{{{{ {field} }}}}'), operator: {{ type: 'boolean', operation: 'true', singleValue: true }}, rightValue: '' }} ], combinator: 'and' }} }}, position: {pos} }} }});\n"""
def respond(var,name,body,code,pos):
    return f"""const {var} = node({{ type: 'n8n-nodes-base.respondToWebhook', version: 1.5, config: {{ name: '{name}', parameters: {{ respondWith: 'text', responseBody: {body}, options: {{ responseCode: {code} }} }}, position: {pos} }}, output: [{{ ok: true }}] }});\n"""
def rule(key,val):
    return f"""{{ outputKey: '{key}', conditions: {{ options: {{ caseSensitive: true, leftValue: '', typeValidation: 'strict' }}, conditions: [ {{ leftValue: expr('{{{{ $json.{ 'action' } }}}}'), operator: {{ type: 'string', operation: 'equals' }}, rightValue: '{val}' }} ], combinator: 'and' }} }}"""

def wf1():
    s=HEAD
    s+="""const metaGet = trigger({ type: 'n8n-nodes-base.webhook', version: 2.1, config: { name: 'Meta Webhook GET (verify)', parameters: { httpMethod: 'GET', path: 'whatslearn-whatsapp', authentication: 'none', responseMode: 'responseNode' }, position: [240, 200] }, output: [{ headers: {}, query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'mock', 'hub.challenge': '12345' }, body: {} }] });\n"""
    s+="""const metaPost = trigger({ type: 'n8n-nodes-base.webhook', version: 2.1, config: { name: 'Meta Webhook POST (messages)', parameters: { httpMethod: 'POST', path: 'whatslearn-whatsapp', authentication: 'none', responseMode: 'responseNode', options: { rawBody: true } }, position: [240, 600] }, output: [{ headers: { 'x-hub-signature-256': 'sha256=mock' }, query: {}, body: {} }] });\n"""
    s+=code('verifyChallenge','Check Verify Token','wa-verify-challenge.js',[720,200],"{ ok: true, challenge: '12345' }")
    s+=ifbool('challengeOk','Token Matches?','$json.ok',[960,200])
    s+=respond('answerChallenge','Answer Challenge',"expr('{{ $json.challenge }}')",200,[1200,120])
    s+=respond('refuseChallenge','Refuse Challenge',"'Forbidden'",403,[1200,300])
    s+=code('checkSignature','Validate Meta Signature','wa-check-signature.js',[480,600],"{ valid: true, messages: [{ wamid: 'wamid.mock', from: '919876543210', type: 'text', text: 'TODAY', metaRawBody: '{}', metaSignature: 'sha256=mock' }] }")
    s+=ifbool('signatureOk','Signature Valid?','$json.valid',[720,600])
    s+=respond('acknowledge','Acknowledge Meta',"'EVENT_RECEIVED'",200,[960,520])
    s+=respond('refuseSignature','Reject Bad Signature',"'Invalid signature'",401,[960,700])
    s+="""const splitMessages = node({ type: 'n8n-nodes-base.splitOut', version: 1, config: { name: 'One Item Per Message', parameters: { fieldToSplitOut: 'messages', include: 'noOtherFields' }, position: [1200, 520] }, output: [{ wamid: 'wamid.mock', from: '919876543210', type: 'text', text: 'TODAY', metaRawBody: '{}', metaSignature: 'sha256=mock' }] });\n"""
    s+="""const showTyping = node({ type: 'n8n-nodes-base.httpRequest', version: 4.4, config: { name: 'Show Typing', parameters: { method: 'POST', url: %s, authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr(`{{ JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: String($json.wamid), typing_indicator: { type: 'text' } }) }}`), options: { timeout: 8000 } }, %s, onError: 'continueRegularOutput', position: [1320, 380] }, output: [{ success: true }] });\n""" % (GRAPH_URL,WA_CRED)
    s+=code('signMessage','Sign Request To WhatsLearn','wa-sign-message.js',[1440,520],"{ url: 'https://whatslearn.example/api/bridge/whatsapp/message', body: '{}', ts: '1', nonce: 'n', signature: 's', to: '919876543210' }")
    s+=signed_http('callWhatsLearn','WhatsLearn Handles Message',[1680,520],"onError: 'continueErrorOutput',","{ action: 'reply', text: 'Hello' }")
    s+="""const routeAction = switchCase({ version: 3.4, config: { name: 'What To Do', parameters: { mode: 'rules', rules: { values: [ %s, %s ] }, options: { fallbackOutput: 'extra', renameFallbackOutput: 'Nothing To Send' } }, position: [1920, 520] } });\n""" % (rule('reply','reply'),rule('tutor','tutor'))
    s+=wa_text('sendReply','Send Reply',"nodeJson(splitMessages, 'from')","expr('{{ $json.text }}')",[2160,420],"onError: 'continueRegularOutput',")
    s+=wa_text('sendProblemNotice','Send Try Again Notice',"nodeJson(splitMessages, 'from')","'Sorry, I could not reach WhatsLearn just now. Nothing was lost. Please send your message again in a minute.'",[1920,720],"onError: 'continueRegularOutput',")
    s+=code('buildTutor','Build Tutor Request','wa-build-tutor.js',[2160,620],"{ requestBody: {}, maxWords: 90, fallback: 'Try again' }")
    s+="""const askOpenAI = node({ type: 'n8n-nodes-base.httpRequest', version: 4.4, config: { name: 'OpenAI Tutor Answer', parameters: { method: 'POST', url: 'https://api.openai.com/v1/chat/completions', authentication: 'predefinedCredentialType', nodeCredentialType: 'openAiApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ $json.requestBody }}'), options: { timeout: 45000 } }, credentials: { openAiApi: newCredential('OpenAI (WhatsLearn tutor)') }, onError: 'continueRegularOutput', position: [2400, 620] }, output: [{ choices: [{ message: { content: 'A short grounded answer.' } }] }] });\n"""
    s+=code('composeTutor','Compose Tutor Reply','wa-compose-tutor-reply.js',[2640,620],"{ reply: 'A short grounded answer.' }")
    s+=wa_text('sendTutorReply','Send Tutor Reply',"nodeJson(splitMessages, 'from')","expr('{{ $json.reply }}')",[2880,620],"onError: 'continueRegularOutput',")
    s+="""const nothing = node({ type: 'n8n-nodes-base.noOp', version: 1, config: { name: 'Nothing To Send', position: [2160, 820] }, output: [{ action: 'none' }] });\n"""
    s+="""export default workflow('whatslearn-wa-chat', 'WhatsLearn 1 - Incoming WhatsApp learning chat')
  .add(metaGet).to(verifyChallenge.to(challengeOk.onTrue(answerChallenge).onFalse(refuseChallenge)))
  .add(metaPost).to(checkSignature.to(signatureOk.onTrue(acknowledge.to(splitMessages.to(showTyping.to(signMessage.to(callWhatsLearn.to(routeAction.onCase(0, sendReply).onCase(1, buildTutor.to(askOpenAI.to(composeTutor.to(sendTutorReply)))).onCase(2, nothing)).onError(sendProblemNotice)))))).onFalse(refuseSignature)));
"""
    return s
def loop_wf(kind):
    N=kind=='notices'
    s=HEAD
    cron="'*/2 * * * *'" if N else "'7 * * * *'"
    s+=f"""const schedule = trigger({{ type: 'n8n-nodes-base.scheduleTrigger', version: 1.3, config: {{ name: '{'Every 2 Minutes' if N else 'Hourly At 7 Past'}', parameters: {{ rule: {{ interval: [ {{ field: 'cronExpression', expression: {cron} }} ] }} }}, position: [240, 300] }}, output: [{{}}] }});\n"""
    if N:
        s+=code('signClaim','Sign Claim Request','notices-sign-claim.js',[480,300],"{ url: 'https://whatslearn.example/api/bridge/whatsapp/outbox', body: '{}', ts: '1', nonce: 'n', signature: 's' }")
        s+=signed_http('claim','Claim Website Notices',[720,300],"","{ items: [{ id: 1, to: '919876543210', text: 'You completed a mission on the website.' }] }")
        s+="""const splitItems = node({ type: 'n8n-nodes-base.splitOut', version: 1, config: { name: 'One Item Per Notice', parameters: { fieldToSplitOut: 'items', include: 'noOtherFields' }, position: [960, 300] }, output: [{ id: 1, to: '919876543210', text: 'You completed a mission on the website.' }] });\n"""
        s+="""const loop = splitInBatches({ version: 3, config: { name: 'Loop Over Notices', parameters: { batchSize: 1 }, position: [1200, 300] } });\n"""
        s+=wa_text('sendNotice','Send Notice',"expr('{{ $json.to }}')","expr('{{ $json.text }}')",[1440,300],"onError: 'continueRegularOutput',")
        s+=code('signReport','Sign Report Request','notices-sign-report.js',[1680,300],"{ url: 'https://whatslearn.example/api/bridge/whatsapp/outbox', body: '{}', ts: '1', nonce: 'n', signature: 's' }")
        s+=signed_http('report','Tell WhatsLearn It Was Sent',[1920,300],"","{ updated: 1 }")
        s+="""export default workflow('whatslearn-wa-sync', 'WhatsLearn 2 - Mission progress and website sync')
  .add(schedule).to(signClaim).to(claim).to(splitItems).to(loop.onEachBatch(sendNotice.to(signReport.to(report.to(nextBatch(loop))))));
"""
    else:
        s+=code('signClaim','Sign Claim Request','reminders-sign-claim.js',[480,300],"{ url: 'https://whatslearn.example/api/bridge/whatsapp/reminders', body: '{}', ts: '1', nonce: 'n', signature: 's' }")
        s+=signed_http('claim','Claim Due Reminders',[720,300],"","{ items: [{ ref: 'u|2026-10-13', to: '919876543210', mode: 'template', template: { name: 'learning_reminder', language: 'en', params: ['Mission title'] } }] }")
        s+="""const splitItems = node({ type: 'n8n-nodes-base.splitOut', version: 1, config: { name: 'One Item Per Reminder', parameters: { fieldToSplitOut: 'items', include: 'noOtherFields' }, position: [960, 300] }, output: [{ ref: 'u|2026-10-13', to: '919876543210', mode: 'template', template: { name: 'learning_reminder', language: 'en', params: ['Mission title'] } }] });\n"""
        s+="""const loop = splitInBatches({ version: 3, config: { name: 'Loop Over Reminders', parameters: { batchSize: 1 }, position: [1200, 300] } });\n"""
        s+="""const isTemplate = ifElse({ version: 2.3, config: { name: 'Needs Approved Template?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $json.mode }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'template' } ], combinator: 'and' } }, position: [1440, 300] } });\n"""
        s+="""const sendTemplate = node({ type: 'n8n-nodes-base.httpRequest', version: 4.4, config: { name: 'Send Approved Template', parameters: { method: 'POST', url: """+GRAPH_URL+""", authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr(`{{ JSON.stringify({ messaging_product: 'whatsapp', to: String($json.to).replace(/[^0-9]/g, ''), type: 'template', template: { name: $json.template.name, language: { code: $json.template.language }, ...(Array.isArray($json.template.params) && $json.template.params.length ? { components: [{ type: 'body', parameters: $json.template.params.map(value => ({ type: 'text', text: String(value) })) }] } : {}) } }) }}`), options: { timeout: 20000 } }, """+WA_CRED+""", onError: 'continueRegularOutput', position: [1680, 220] }, output: [{ messages: [{ id: 'wamid.mock' }] }] });\n"""
        s+=wa_text('sendText','Send Free Text (inside 24h window)',"expr('{{ $json.to }}')","expr('{{ $json.text }}')",[1680,420],"onError: 'continueRegularOutput',")
        s+=code('signReport','Sign Report Request','reminders-sign-report.js',[1920,300],"{ url: 'https://whatslearn.example/api/bridge/whatsapp/reminders', body: '{}', ts: '1', nonce: 'n', signature: 's' }")
        s+=signed_http('report','Tell WhatsLearn It Was Sent',[2160,300],"","{ updated: 1 }")
        s+="""export default workflow('whatslearn-wa-reminders', 'WhatsLearn 3 - Opt-in lessons and reminders')
  .add(schedule).to(signClaim).to(claim).to(splitItems).to(loop.onEachBatch(isTemplate.onTrue(sendTemplate.to(signReport.to(report.to(nextBatch(loop))))).onFalse(sendText.to(signReport))));
"""
    return s
w=sys.argv[1]
print(wf1() if w=='1' else loop_wf('notices') if w=='2' else loop_wf('reminders'))
