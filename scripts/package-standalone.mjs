// Vinext beta standalone tracing omits React peer dependencies used by its server.
// Copy the installed versions as real files so deployments need no pnpm symlinks.
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, copyFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const root = process.cwd();
const standalone = path.join(root, 'dist', 'standalone');
if (existsSync(path.join(root, 'runtime', 'start-node.mjs'))) {
  copyFileSync(path.join(root, 'runtime', 'start-node.mjs'), path.join(standalone, 'server.js'));
}
if (existsSync(path.join(root, 'drizzle'))) {
  cpSync(path.join(root, 'drizzle'), path.join(standalone, 'drizzle'), { recursive: true });
}
if (!existsSync(path.join(standalone, 'node_modules', 'vinext'))) {
  throw new Error('Standalone Vinext output is missing; run the production build first.');
}
const copied = new Set();
function copyRuntime(name, resolver) {
  if (copied.has(name)) return;
  let manifest;
  try { manifest = realpathSync(resolver.resolve(`${name}/package.json`)); }
  catch (error) {
    if (error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw error;
    let directory = path.dirname(realpathSync(resolver.resolve(name)));
    while (true) {
      const candidate = path.join(directory, 'package.json');
      if (existsSync(candidate) && JSON.parse(readFileSync(candidate, 'utf8')).name === name) { manifest = candidate; break; }
      const parent = path.dirname(directory); if (parent === directory) throw error; directory = parent;
    }
  }
  const source = path.dirname(manifest);
  const destination = path.join(standalone, 'node_modules', name);
  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(source, destination, {
    recursive: true,
    dereference: true,
    filter: file => !path.relative(source, file).split(path.sep).includes('node_modules'),
  });
  copied.add(name);
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
  const resolveDependency = createRequire(manifest);
  for (const dependency of Object.keys(pkg.dependencies ?? {})) {
    copyRuntime(dependency, resolveDependency);
  }
}
const resolveRoot = createRequire(path.join(root, 'package.json'));
mkdirSync(path.join(standalone, 'runtime'), {recursive:true});
copyFileSync(path.join(root,'runtime','project-runner.cjs'),path.join(standalone,'runtime','project-runner.cjs'));
for (const name of ['react', 'react-dom', 'quickjs-emscripten']) copyRuntime(name, resolveRoot);
const resolveDeployed = createRequire(path.join(standalone, 'node_modules', 'vinext', 'package.json'));
for (const name of copied) resolveDeployed.resolve(name);
console.log(`Standalone runtime packaged: ${[...copied].join(', ')}`);
