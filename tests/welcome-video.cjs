const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=f=>fs.readFileSync(path.join(process.cwd(),f),'utf8');

test('home has no background video or mascot',()=>{
 const home=src('app/page.tsx');
 const hero=src('components/whatslearn/visual-start.tsx');
 const layout=src('app/layout.tsx');
 const css=src('app/globals.css');
 assert.doesNotMatch(home,/<video|home-bg-video/);
 assert.match(hero,/visual-disclosure[\s\S]*<WelcomeVideo\s*\/>/);
 assert.doesNotMatch(css,/\.home-bg-video\{/);
 assert.doesNotMatch(layout,/Mascot/);
 assert.ok(fs.existsSync(path.join(process.cwd(),'public','videos','whatslearn-welcome.mp4')));
});

test('welcome video is loaded only after a click and removed when closed',()=>{
 const video=src('components/whatslearn/welcome-video.tsx');
 assert.match(video,/useState\(false\)/);
 assert.match(video,/onClick=\{\(\)=>setOpen\(true\)\}/);
 assert.match(video,/onOpenChange=\{setOpen\}/);
 assert.match(video,/open&&<video/);
 assert.match(video,/controls/);
 assert.match(video,/preload="none"/);
 assert.match(video,/<DialogTitle/);
 assert.match(video,/<DialogTrigger asChild>/,'closing restores keyboard focus to the video button');
 assert.match(src('components/ui/dialog.tsx'),/<XIcon\s*\/>/);
});

test('floating mentor uses the learning WhatsApp account and a safe external link',()=>{
 const widget=src('components/whatslearn/whatsapp-mentor-widget.tsx');
 assert.match(widget,/whatsappLearningUrl\(/);
 assert.match(widget,/whatsappLinkProps/);
 assert.match(widget,/WhatsLearn Mentor/);
 assert.doesNotMatch(widget,/whatsappChatUrl\(/);
 assert.match(src('app/layout.tsx'),/<WhatsAppMentorWidget\s*\/>/);
});

