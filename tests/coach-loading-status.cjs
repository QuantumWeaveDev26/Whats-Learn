const test=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/harness.cjs');
require.extensions['.tsx']=require.extensions['.ts'];
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const Coach=h.load('components/whatslearn/practice-coach.tsx').default;
const {missions}=h.load('lib/missions.ts');
test('AI coach initially reports availability checking, never a disconnected integration',()=>{
 const html=renderToStaticMarkup(React.createElement(Coach,{mission:missions.find(m=>m.id==='d1')}));
 assert.match(html,/role="status">Checking AI availability…/);
 assert.doesNotMatch(html,/Live AI coaching is not connected yet/);
 assert.doesNotMatch(html,/Ask your own question/);
 assert.match(html,/Explain simply/);
});
