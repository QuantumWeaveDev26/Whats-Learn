#!/usr/bin/env python3
"""Merges the three workflow SDK sources from gen_sdk.py into ONE workflow with three entry points. Prints TypeScript: python3 n8n/gen_merged.py"""
import re,subprocess,sys,os
H=os.path.dirname(os.path.abspath(__file__))
def part(i):
    s=subprocess.check_output(['python3',os.path.join(H,'gen_sdk.py'),str(i)],text=True)
    lines=[l for l in s.split('\n') if not l.startswith('import ')]
    s='\n'.join(lines)
    m=re.search(r"export default workflow\('[^']+', '[^']+'\)\s*(\.add\(.*\);)\s*$",s,re.S)
    chain=m.group(1).rstrip(';'); body=s[:m.start()]
    names=re.findall(r'^const (\w+) =',body,re.M)
    pre=f'p{i}_'
    keep=[]
    def hold(m):
        keep.append(m.group(0)); return '"@@KEEP%d@@"'%(len(keep)-1)
    body=re.sub(r'"(?:[^"\\]|\\.)*"|\'[^\']*\'|`[^`]*`',hold,body)  # protect string literals
    for n in names:
        body=re.sub(r'(?<![\w.])'+n+r'\b',pre+n,body); chain=re.sub(r'\b'+n+r'\b',pre+n,chain)
    body=re.sub(r'"@@KEEP(\d+)@@"',lambda m:keep[int(m.group(1))],body)
    dy={1:0,2:1100,3:1700}[i]
    body=body.replace("expr('{{ $env.WHATSAPP_PHONE_NUMBER_ID }}')","expr('{{ $(\"Resolve Settings\").first().json.cfg.phoneNumberId }}')")
    trig={1:['metaGet','metaPost'],2:['schedule'],3:['schedule']}[i]
    def shift(line):
        m=re.match(r'const (\w+) =',line)
        if m and (m.group(1) in [pre+t for t in trig]): return line
        return re.sub(r"position: \[(\d+), (-?\d+)\]",lambda q:f"position: [{int(q.group(1))+900}, {q.group(2)}]",line)
    body='\n'.join(shift(l) for l in body.split('\n'))
    body=re.sub(r"position: \[(\d+), (\d+)\]",lambda m:f"position: [{m.group(1)}, {int(m.group(2))+dy}]",body)
    if i==2:
        for old in ['Sign Claim Request','Sign Report Request','Tell WhatsLearn It Was Sent']: body=body.replace(f"name: '{old}'",f"name: 'Notices: {old}'")
    if i==3:
        for old in ['Sign Claim Request','Sign Report Request','Tell WhatsLearn It Was Sent']: body=body.replace(f"name: '{old}'",f"name: 'Reminders: {old}'")
    return body,chain
HEAD="import { workflow, node, trigger, ifElse, switchCase, splitInBatches, nextBatch, newCredential, expr, nodeJson } from '@n8n/workflow-sdk';\n"
def note(var,name,text,x,y,w,h,color):
    return f"const {var} = node({{ type: 'n8n-nodes-base.stickyNote', version: 1, config: {{ name: '{name}', parameters: {{ content: {text!r}, width: {w}, height: {h}, color: {color} }}, position: [{x}, {y}] }}, output: [{{}}] }});\n"
out=HEAD
for i in (1,2,3):
    b,c=part(i); out+=b
def settings_nodes():
    names=['verifyToken','appSecret','baseUrl','bridgeSecret','phoneNumberId']
    ph={'verifyToken':'PASTE_VERIFY_TOKEN_HERE','appSecret':'PASTE_META_APP_SECRET_HERE','baseUrl':'PASTE_WEBSITE_ADDRESS_HERE','bridgeSecret':'PASTE_BRIDGE_SECRET_HERE','phoneNumberId':'PASTE_PHONE_NUMBER_ID_HERE'}
    a=', '.join("{ id: 'a%d', name: '%s', value: '%s', type: 'string' }"%(k,n,ph[n]) for k,n in enumerate(names))
    r="const mySettings = node({ type: 'n8n-nodes-base.set', version: 3.4, config: { name: 'My Settings (edit here)', parameters: { mode: 'manual', includeOtherFields: true, assignments: { assignments: [ "+a+" ] }, options: {} }, position: [480, 1000] }, output: [{ verifyToken: 'PASTE_VERIFY_TOKEN_HERE' }] });\n"
    js=open(os.path.join(H,'code','wa-resolve-settings.js')).read().rstrip('\n')
    r+="const resolveSettings = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Resolve Settings', parameters: { mode: 'runOnceForAllItems', language: 'javaScript', jsCode: %s }, position: [720, 1000] }, output: [{ cfg: {} }] });\n"%json.dumps(js)
    def rule(k,n): return "{ outputKey: '%s', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [ { leftValue: expr('{{ $(\"%s\").isExecuted }}'), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' } ], combinator: 'and' } }"%(k,n)
    rules=', '.join([rule('verify','Meta Webhook GET (verify)'),rule('messages','Meta Webhook POST (messages)'),rule('sync','Every 2 Minutes'),rule('reminders','Hourly At 7 Past')])
    r+="const whichPart = switchCase({ version: 3.4, config: { name: 'Which Part Is Running?', parameters: { mode: 'rules', rules: { values: [ "+rules+" ] }, options: {} }, position: [960, 1000] } });\n"
    return r
import json
out+=settings_nodes()
out+=note('s0','Settings - edit once',"## Settings (edit once)\nOpen the node 'My Settings (edit here)' and replace each PASTE_... value. A value set on the n8n server (environment variable) wins over this node. Anything still saying PASTE is treated as not set.",440,820,520,160,3)
out+=note('s1','Section 1 - Incoming WhatsApp learning chat',"## 1. Incoming WhatsApp learning chat\nMeta webhook (GET verify, POST messages). Checks the app-secret signature, answers the challenge, ignores status events, then asks WhatsLearn to handle each message. WhatsLearn does all scoring, unlock and daily-limit checks. OpenAI is used only for grounded tutor answers.",1100,-120,2800,120,5)
out+=note('s2','Section 2 - Website to WhatsApp sync',"## 2. Mission progress and website sync\nEvery 2 minutes: claim signed notices from WhatsLearn (mission saved, badge earned) for linked, opted-in learners, send one short message, report back. n8n never calculates points.",1100,980,2000,100,4)
out+=note('s3','Section 3 - Opt-in lessons and reminders',"## 3. Opt-in lessons and reminders\nHourly: WhatsLearn says who is due (opt-in, chosen time, India time, quiet hours, once a day). Free text only inside the 24 h window, otherwise the approved Meta template. STOP is honoured by WhatsLearn.",1100,1580,2200,100,6)
verify="p1_verifyChallenge.to(p1_challengeOk.onTrue(p1_answerChallenge).onFalse(p1_refuseChallenge))"
msgs="p1_checkSignature.to(p1_signatureOk.onTrue(p1_acknowledge.to(p1_splitMessages.to(p1_showTyping.to(p1_signMessage.to(p1_callWhatsLearn.to(p1_routeAction.onCase(0, p1_sendReply).onCase(1, p1_buildTutor.to(p1_askOpenAI.to(p1_composeTutor.to(p1_sendTutorReply)))).onCase(2, p1_nothing)).onError(p1_sendProblemNotice)))))).onFalse(p1_refuseSignature))"
sync="p2_signClaim.to(p2_claim).to(p2_splitItems).to(p2_loop.onEachBatch(p2_sendNotice.to(p2_signReport.to(p2_report.to(nextBatch(p2_loop))))))"
rem="p3_signClaim.to(p3_claim).to(p3_splitItems).to(p3_loop.onEachBatch(p3_isTemplate.onTrue(p3_sendTemplate.to(p3_signReport.to(p3_report.to(nextBatch(p3_loop))))).onFalse(p3_sendText.to(p3_signReport))))"
out+="export default workflow('whatslearn-wa-all', 'WhatsLearn Mentor (WhatsApp learning, sync and reminders)')\n"
out+="  .add(p1_metaGet).to(mySettings)\n  .add(p1_metaPost).to(mySettings)\n  .add(p2_schedule).to(mySettings)\n  .add(p3_schedule).to(mySettings)\n"
out+="  .add(mySettings).to(resolveSettings).to(whichPart.onCase(0, %s).onCase(1, %s).onCase(2, %s).onCase(3, %s));\n"%(verify,msgs,sync,rem)
print(out)
