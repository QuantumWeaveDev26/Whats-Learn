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
 assert.match(hero,/Pick a skill\. Make something real\.<\/p>[\s\S]*?<WelcomeVideo\s*\/>/);
 assert.ok(hero.indexOf('<WelcomeVideo/>')<hero.indexOf('hero-play-button'),'video appears before the first challenge button');
 assert.ok(!hero.includes('PLAYABLE STORY'),'front challenge card should not show the Playable Story badge');
 assert.doesNotMatch(css,/\.home-bg-video\{/);
 assert.doesNotMatch(layout,/Mascot/);
 assert.ok(fs.existsSync(path.join(process.cwd(),'public','videos','whatslearn-welcome.mp4')));
});

test('welcome video stays inline and can be enlarged with a closable accessible dialog',()=>{
 const video=src('components/whatslearn/welcome-video.tsx');
 assert.match(video,/className="welcome-video-inline"/);
 assert.match(video,/<video ref=\{inline\} src="\/videos\/whatslearn-welcome.mp4"/);
 assert.match(video,/controls playsInline preload="metadata"/);
 assert.doesNotMatch(video,/welcome-video-trigger|autoPlay/);
 assert.match(video,/<DialogTrigger asChild>/);assert.match(video,/aria-label="Enlarge welcome video"/);assert.match(video,/onOpenChange=\{changeOpen\}/);assert.match(video,/open&&<video ref=\{expanded\}/);
 assert.match(src('components/ui/dialog.tsx'),/<XIcon\s*\/>/);
 assert.match(src('app/globals.css'),/\.welcome-video-inline video\{[^}]*aspect-ratio:16\/9/);
});

test('floating mentor uses the learning WhatsApp account and a safe external link',()=>{
 const widget=src('components/whatslearn/whatsapp-mentor-widget.tsx');
 assert.match(widget,/whatsappLearningUrl\(/);
 assert.match(widget,/whatsappLinkProps/);
 assert.match(widget,/WhatsLearn Mentor/);
 assert.doesNotMatch(widget,/whatsappChatUrl\(/);
 assert.match(src('app/layout.tsx'),/<WhatsAppMentorWidget\s*\/>/);
});

