#!/usr/bin/env node
/**
 * Local check of the SQL migrations. It applies drizzle/*.sql, in file order, to a throw-away in-memory SQLite database (never to any real or hosted database)
 * and checks the order, the journal and the tables the app needs. Run:  node scripts/verify-migrations.cjs   (or  pnpm db:verify)
 */
const fs=require('node:fs'),path=require('node:path'),{DatabaseSync}=require('node:sqlite');
const dir=path.resolve(__dirname,'..','drizzle');
function verify(){
 const files=fs.readdirSync(dir).filter(f=>/^\d{4}_.+\.sql$/.test(f)).sort();const problems=[];
 files.forEach((f,i)=>{if(Number(f.slice(0,4))!==i)problems.push(`migration numbers must be 0000, 0001, … with no gap: ${f} is at position ${i}`)});
 const journal=JSON.parse(fs.readFileSync(path.join(dir,'meta','_journal.json'),'utf8')).entries.map(e=>e.tag);
 if(JSON.stringify(journal)!==JSON.stringify(files.map(f=>f.replace(/\.sql$/,''))))problems.push('drizzle/meta/_journal.json does not list the same migrations in the same order');
 const db=new DatabaseSync(':memory:');const applied=[];
 for(const f of files){try{db.exec(fs.readFileSync(path.join(dir,f),'utf8').replaceAll('--> statement-breakpoint',''));applied.push(f)}catch(e){problems.push(`${f} failed: ${e.message}`);break}}
 const last=files.at(-1)||'';const i9=files.findIndex(f=>f.startsWith('0009_')),i10=files.findIndex(f=>f.startsWith('0010_'));
 if(i9<0||i10<0||i10<=i9)problems.push('0010_checkpoint_clears must come after 0009');
 const cols=t=>{try{return db.prepare(`PRAGMA table_info(${t})`).all().map(c=>c.name+(c.pk?'*':''))}catch{return []}};
 const need={point_ledger:['user_id','kind','ref','delta'],checkpoint_clears:['user_id*','track*','after_mission*','created_at'],mission_scores:['user_id*','mission_id*','day'],reward_claims:[],auth_attempts:[],uploads:[]};
 for(const [t,c] of Object.entries(need)){const have=cols(t);if(!have.length)problems.push(`table ${t} is missing`);for(const x of c)if(!have.includes(x))problems.push(`${t} lacks ${x}`)}
 try{db.prepare("INSERT INTO checkpoint_clears (user_id,track,after_mission,created_at) VALUES ('u','marketing',2,'x')").run();let dup=false;try{db.prepare("INSERT INTO checkpoint_clears (user_id,track,after_mission,created_at) VALUES ('u','marketing',2,'y')").run()}catch{dup=true}if(!dup)problems.push('checkpoint_clears accepts a duplicate badge row')}catch(e){problems.push('checkpoint_clears insert failed: '+e.message)}
 try{db.prepare("INSERT INTO point_ledger (user_id,kind,ref,delta,created_at) VALUES ('u','starting','start',50,'x')").run();let dup=false;try{db.prepare("INSERT INTO point_ledger (user_id,kind,ref,delta,created_at) VALUES ('u','starting','start',50,'y')").run()}catch{dup=true}if(!dup)problems.push('point_ledger accepts a second starting grant')}catch(e){problems.push('point_ledger insert failed: '+e.message)}
 return {files,applied,problems,last};
}
module.exports={verify};
if(require.main===module){const r=verify();console.log(`Applied in order to an in-memory database: ${r.applied.join(', ')}`);if(r.problems.length){console.error('PROBLEMS:\n- '+r.problems.join('\n- '));process.exit(1)}console.log(`OK: ${r.files.length} migrations, last is ${r.last}. 0010 runs after 0009. Nothing was applied to any real or hosted database.`)}
