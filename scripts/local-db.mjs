#!/usr/bin/env node
/**
 * Applies the project's migrations (drizzle/*.sql) to the LOCAL preview database only, in order, once each.
 * Run `pnpm build` first, then `pnpm db:local`. It never touches the hosted database.
 * Applied files are remembered in .wrangler/state/whatslearn-migrations.json.
 */
import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const ledger=path.join(root,'.wrangler','state','whatslearn-migrations.json');
export const migrationFiles=()=>readdirSync(path.join(root,'drizzle')).filter(f=>/^\d{4}_.*\.sql$/.test(f)).sort();
export function appliedMigrations(){try{return JSON.parse(readFileSync(ledger,'utf8')).applied||[]}catch{return []}}
export function pendingMigrations(){const done=new Set(appliedMigrations());return migrationFiles().filter(f=>!done.has(f))}
function save(list){mkdirSync(path.dirname(ledger),{recursive:true});writeFileSync(ledger,JSON.stringify({applied:list},null,1))}

function main(){
 if(!existsSync(path.join(root,'dist','server','wrangler.json'))){console.error('Run `pnpm build` first; the local database settings come from the build.');process.exit(1)}
 const done=appliedMigrations();const pending=pendingMigrations();
 if(!pending.length){console.log('Local database is up to date.');return}
 for(const file of pending){
  const r=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file',path.join('drizzle',file),'--yes'],{cwd:root,encoding:'utf8'});
  const output=`${r.stdout||''}\n${r.stderr||''}`;
  if(r.status!==0){
   if(/already exists|duplicate column/i.test(output)){console.log(`  ${file}: already in this database, marked as applied`);done.push(file);save(done);continue}
   console.error(`  ${file}: failed, so nothing after it was applied.\n${output.split('\n').filter(l=>/error/i.test(l)).slice(0,5).join('\n')}`);process.exit(1);
  }
  console.log(`  ${file}: applied`);done.push(file);save(done);
 }
 console.log('Local database is ready. Start the preview with `pnpm start`.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
