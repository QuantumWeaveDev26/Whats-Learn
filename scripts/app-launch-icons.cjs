// Render the same symbol viewport used by the app's existing SVG splash.
// Separate filenames preserve all shared website assets and refresh installed metadata.
const fs=require('node:fs'),path=require('node:path');
const entry=fs.readdirSync('node_modules/.pnpm').find(n=>n.startsWith('sharp@'));
const sharp=require(path.resolve('node_modules/.pnpm',entry,'node_modules/sharp'));
const image=fs.readFileSync('public/images/app-icon-512.png').toString('base64');
async function render(size,maskable){
 const mark=maskable?Math.round(size*.68):size;
 const offset=(size-mark)/2;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#125C43"/><svg x="${offset}" y="${offset}" width="${mark}" height="${mark}" viewBox="58 22 76 76"><defs><clipPath id="round"><circle cx="96" cy="60" r="38"/></clipPath></defs><image clip-path="url(#round)" href="data:image/png;base64,${image}" width="192" height="192"/></svg></svg>`;
 await sharp(Buffer.from(svg)).png().toFile(`public/images/app-launch-mark-${maskable?'maskable-':''}${size}.png`);
}
Promise.all([render(192,false),render(512,false),render(512,true)]).catch(e=>{console.error(e);process.exitCode=1});

