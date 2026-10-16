const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');

test('journey rows use real expandable buttons with named content panels',()=>{
 const s=fs.readFileSync('components/whatslearn/journey-steps.tsx','utf8');
 assert.match(s,/<button/);
 assert.match(s,/aria-expanded=\{expanded\}/);
 assert.match(s,/aria-controls=/);
 assert.match(s,/hidden=\{!expanded\}/);
 assert.match(s,/onClick=/);
 assert.match(s,/expanded\?<Minus/);
 assert.match(fs.readFileSync('app/page.tsx','utf8'),/<JourneySteps\/>/);
});

test('WhatsApp links have a wrapping layout with a visible gap',()=>{
 assert.match(fs.readFileSync('app/page.tsx','utf8'),/className="whatsapp-note-actions"/);
 assert.match(fs.readFileSync('app/globals.css','utf8'),/\.whatsapp-note-actions\{[^}]*display:flex;[^}]*flex-wrap:wrap;[^}]*gap:/);
});
