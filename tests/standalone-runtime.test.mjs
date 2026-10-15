import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = mkdtempSync(path.join(tmpdir(), 'whatslearn-standalone-'));
const deployed = mkdtempSync(path.join(tmpdir(), 'whatslearn-deployed-'));
const script = fileURLToPath(new URL('../scripts/package-standalone.mjs', import.meta.url));
try {
  mkdirSync(path.join(root, 'dist/standalone/node_modules/vinext'), { recursive: true });
  writeFileSync(path.join(root, 'package.json'), '{"type":"module"}');
  for (const [name, dependencies] of [['react', {}], ['react-dom', { scheduler: '1.0.0' }], ['scheduler', {}]]) {
    const dir = path.join(root, 'node_modules', name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version: '1.0.0', main: 'index.js', dependencies }));
    writeFileSync(path.join(dir, 'index.js'), 'module.exports = {};');
  }
  const probe = path.join(root, 'dist/standalone/node_modules/vinext/probe.mjs');
  writeFileSync(probe, "import 'react'; import 'react-dom'; import 'scheduler';");
  cpSync(path.join(root, 'dist/standalone'), deployed, { recursive: true });
  const deployedProbe = path.join(deployed, 'node_modules/vinext/probe.mjs');
  assert.notEqual(spawnSync(process.execPath, [deployedProbe]).status, 0, 'reproduces missing runtime dependencies');
  const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  for (const name of ['react', 'react-dom', 'scheduler']) {
    assert.ok(existsSync(path.join(root, 'dist/standalone/node_modules', name, 'package.json')));
  }
  cpSync(path.join(root, 'dist/standalone'), deployed, { recursive: true });
  assert.equal(spawnSync(process.execPath, [deployedProbe]).status, 0, 'isolated runtime resolves all React dependencies');
  console.log('Standalone React runtime packaging passed.');
} finally {
  rmSync(root, { recursive: true, force: true });
  rmSync(deployed, { recursive: true, force: true });
}
