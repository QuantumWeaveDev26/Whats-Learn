// Vinext beta standalone tracing omits React peer dependencies used by its server.
// Copy the installed versions as real files so deployments need no pnpm symlinks.
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const root = process.cwd();
const standalone = path.join(root, 'dist', 'standalone');
if (existsSync(path.join(root, 'drizzle'))) {
  cpSync(path.join(root, 'drizzle'), path.join(standalone, 'drizzle'), { recursive: true });
}
if (!existsSync(path.join(standalone, 'node_modules', 'vinext'))) {
  throw new Error('Standalone Vinext output is missing; run the production build first.');
}
const copied = new Set();
function copyRuntime(name, resolver) {
  if (copied.has(name)) return;
  const manifest = realpathSync(resolver.resolve(`${name}/package.json`));
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
for (const name of ['react', 'react-dom']) copyRuntime(name, resolveRoot);
const resolveDeployed = createRequire(path.join(standalone, 'node_modules', 'vinext', 'package.json'));
for (const name of copied) resolveDeployed.resolve(name);
console.log(`Standalone runtime packaged: ${[...copied].join(', ')}`);
