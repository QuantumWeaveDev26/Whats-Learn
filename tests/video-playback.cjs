const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {pauseAndCapture,restorePlayback}=require('../lib/video-playback.ts');
const fake=(time,paused)=>({currentTime:time,paused,ended:false,duration:26,pause(){this.paused=true},play(){this.paused=false;return Promise.resolve()}});
test('enlarging transfers playback without running two videos and closing keeps the latest position',()=>{
 const inline=fake(8,false),large=fake(0,true),position=pauseAndCapture(inline);
 assert.equal(inline.paused,true);assert.deepEqual(position,{time:8,playing:true});
 restorePlayback(large,position,true);assert.equal(large.currentTime,8);assert.equal(large.paused,false);
 large.currentTime=12;const closing=pauseAndCapture(large);restorePlayback(inline,closing);
 assert.equal(large.paused,true);assert.equal(inline.currentTime,12);assert.equal(inline.paused,true);
});
test('a paused video stays paused when enlarged; invalid seek ranges are bounded',()=>{
 const inline=fake(5,true),large=fake(0,true);restorePlayback(large,pauseAndCapture(inline),true);
 assert.equal(large.currentTime,5);assert.equal(large.paused,true);
 restorePlayback(large,{time:99,playing:false});assert.equal(large.currentTime,26);
 restorePlayback(large,{time:-1,playing:false});assert.equal(large.currentTime,0);
 assert.deepEqual(pauseAndCapture(null),{time:0,playing:false});restorePlayback(null,{time:0,playing:false});
});
