import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// Preserve the D1 query interface already used by points, missions and billing.
// SQLite and the migration ledger live outside deployment release directories.
export function openDatabase(filename, migrations = path.resolve('drizzle')) {
  mkdirSync(path.dirname(filename), { recursive: true });
  const sqlite = new DatabaseSync(filename);
  sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  sqlite.exec('CREATE TABLE IF NOT EXISTS whatslearn_migrations (name TEXT PRIMARY KEY NOT NULL)');
  for (const name of readdirSync(migrations).filter(name => /^\d+.*\.sql$/.test(name)).sort()) {
    sqlite.exec('BEGIN IMMEDIATE');
    try {
      if (!sqlite.prepare('SELECT name FROM whatslearn_migrations WHERE name=?').get(name)) {
        sqlite.exec(readFileSync(path.join(migrations, name), 'utf8'));
        sqlite.prepare('INSERT INTO whatslearn_migrations(name) VALUES (?)').run(name);
      }
      sqlite.exec('COMMIT');
    } catch (error) { sqlite.exec('ROLLBACK'); sqlite.close(); throw error; }
  }
  const normalize = value => typeof value === 'boolean' ? Number(value) : value;
  function statement(sql, parameters = []) {
    const args = parameters.map(normalize);
    const execute = () => {
      const query = sqlite.prepare(sql);
      const results = query.all(...args);
      const meta = sqlite.prepare('SELECT changes() AS changes, last_insert_rowid() AS last_row_id').get();
      return { success: true, results, meta: { ...meta, duration: 0 } };
    };
    return {
      bind: (...values) => statement(sql, values),
      async first(column) { const row = sqlite.prepare(sql).get(...args); return column ? row?.[column] ?? null : row ?? null; },
      async all() { return execute(); },
      async run() { return execute(); },
      async raw(options) {
        const query = sqlite.prepare(sql);
        const objects = query.all(...args);
        const rows = objects.map(row => Object.values(row));
        return options?.columnNames ? [Object.keys(objects[0] ?? {}), ...rows] : rows;
      },
      execute,
    };
  }
  return {
    prepare: sql => statement(sql),
    async batch(statements) {
      sqlite.exec('BEGIN IMMEDIATE');
      try { const results = statements.map(query => query.execute()); sqlite.exec('COMMIT'); return results; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
    async exec(sql) { sqlite.exec(sql); return { count: 1, duration: 0 }; },
    close: () => sqlite.close(),
  };
}
