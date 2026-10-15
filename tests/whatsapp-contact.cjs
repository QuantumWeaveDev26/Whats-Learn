const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(process.cwd(), 'lib', 'contact.ts'), 'utf8');
assert.match(source, /whatsappContactNumber='919187951536'/, 'the WhatsLearn business click-to-chat number is configured');
assert.match(source, /https:\/\/wa\.me\//, 'contact link uses WhatsApp click-to-chat');
console.log('WhatsApp contact configuration passed');
