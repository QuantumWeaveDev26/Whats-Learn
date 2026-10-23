const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');

test('UI grooming keeps the four course names and defines responsive visual-system hooks',()=>{
 const home=src('lib/programmes.ts');assert.match(src('app/page.tsx'),/<ProgrammeExplorer learner=\{learner\}\/>/);
 for(const name of ['AI Digital Marketing','AI Full-Stack Development','AI Filmmaking','AI-powered Visual Storytelling'])assert.ok(home.includes(name),name);
 const css=src('app/globals.css'),motion=src('app/motion.css');
 for(const hook of ['ui-card-primary','ui-card-secondary','mission-progress-map','daily-return-cue'])assert.ok(css.includes('.'+hook)||motion.includes('.'+hook),hook);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('mascot stays visual-only and declares travel poses',()=>{
 const mascot=src('components/whatslearn/mascot.tsx');
 for(const pose of ['walk','run','rest','wave','point','think','beckon','thumbs','cheer'])assert.ok(mascot.includes(`'${pose}'`),pose);
 assert.ok(!/<text|<title|<desc|mascot-say/.test(mascot),'no visible mascot text');
});