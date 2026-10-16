import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const directory = mkdtempSync(path.join(tmpdir(), 'whatslearn-node-'));
process.env.WHATSLEARN_DATA_DIR = directory;
let database;
try {
  const {env} = await import('../runtime/node-env.mjs');
  process.env.STARTING_POINTS = '50';
  assert.equal(env.STARTING_POINTS, '50');
  assert.equal(env.WHATSLEARN_RUNTIME, 'node');
  const db = env.DB;
  database = db;
  const migrations = await db.prepare('SELECT COUNT(*) n FROM whatslearn_migrations').first();
  const expectedMigrations=readdirSync(new URL('../drizzle/',import.meta.url)).filter(name=>/^\d+.*\.sql$/.test(name));
  assert.equal(migrations.n, expectedMigrations.length);
  const profileColumns=(await db.prepare('PRAGMA table_info(learner_profiles)').all()).results.map(row=>row.name);
  assert.ok(profileColumns.includes('display_name'));
  assert.ok(profileColumns.includes('style'));
  await db.prepare("INSERT INTO point_ledger(user_id,kind,ref,delta,created_at) VALUES (?,'starting','start',50,?)").bind('test-user',new Date().toISOString()).run();
  assert.equal((await db.prepare('SELECT SUM(delta) balance FROM point_ledger WHERE user_id=?').bind('test-user').first()).balance,50);
  await assert.rejects(db.batch([
    db.prepare("INSERT INTO point_ledger(user_id,kind,ref,delta,created_at) VALUES ('rollback','starting','start',50,'now')"),
    db.prepare('INSERT INTO table_that_does_not_exist VALUES (1)'),
  ]));
  assert.equal(await db.prepare("SELECT * FROM point_ledger WHERE user_id='rollback'").first(),null);
  assert.deepEqual(await db.prepare('SELECT 4 AS value').raw(),[[4]]);
  assert.equal(await db.prepare('SELECT 4 AS value').first('value'),4);
  db.close();
  const reopened = (await import('../runtime/node-database.mjs')).openDatabase(path.join(directory,'learning.sqlite'));
  assert.equal((await reopened.prepare('SELECT SUM(delta) balance FROM point_ledger WHERE user_id=?').bind('test-user').first()).balance,50);
  reopened.close();
  console.log('Node runtime: migrations, points, rollback and persistent reopening passed.');
} finally { try { database?.close(); } catch {} rmSync(directory,{recursive:true,force:true}); }
