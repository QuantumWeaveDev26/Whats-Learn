#!/usr/bin/env node
// Builds importable n8n workflow JSON from the SDK source printed by gen_sdk.py.
// Usage: node n8n/build_json.cjs   (writes n8n/workflows/whatslearn-all-in-one.json). Needs python3.
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const FILES = { all: 'whatslearn-all-in-one' };

function build(which) {
  const src = execFileSync('python3', [path.join(here, 'gen_merged.py')], { encoding: 'utf8' })
    .split('\n').filter((l) => !l.startsWith('import ')).join('\n').replace('export default', 'return');
  const nodes = []; const conns = {};
  const headOf = (t) => (t && t.head) || t;
  const connect = (from, out, to) => {
    if (to && to.nextBatchOf) return connect(from, out, to.nextBatchOf);
    const h = headOf(to);
    conns[from.name] = conns[from.name] || { main: [] };
    const m = conns[from.name].main;
    while (m.length <= out) m.push([]);
    m[out].push({ node: h.name, type: 'main', index: 0 });
  };
  const chainOf = (head, tails) => ({
    head, tails,
    to(t) { tails.forEach((f) => connect(f.n, f.o, t)); const th = t && t.nextBatchOf ? [] : (t.tails || [{ n: headOf(t), o: 0 }]); return chainOf(head, th); },
    onError(h) { head.onError(h); return this; },
    add(h) { return chainOf(headOf(h), [{ n: headOf(h), o: 0 }]); },
  });
  const make = (type, version, config, extra = {}) => {
    const n = {
      name: config.name, type, version, config, branchTails: [],
      to(t) { return chainOf(n, [{ n, o: 0 }]).to(t); },
      onError(h) { connect(n, 1, h); return n; },
      onTrue(b) { connect(n, 0, b); return n; },
      onFalse(b) { connect(n, 1, b); return n; },
      onCase(i, b) { connect(n, i, b); return n; },
      onEachBatch(b) { connect(n, 1, b); return n; },
      ...extra,
    };
    nodes.push(n); return n;
  };
  const sdk = {
    node: (d) => make(d.type, d.version, d.config),
    trigger: (d) => make(d.type, d.version, d.config),
    ifElse: (d) => make('n8n-nodes-base.if', d.version, d.config),
    switchCase: (d) => make('n8n-nodes-base.switch', d.version, d.config),
    splitInBatches: (d) => make('n8n-nodes-base.splitInBatches', d.version, d.config),
    nextBatch: (l) => ({ nextBatchOf: l }),
    newCredential: (name) => ({ __cred: name }),
    expr: (s) => '=' + s,
    nodeJson: (n, f) => `={{ $('${n.name}').item.json.${f} }}`,
    workflow: (_id, name) => ({ _name: name, add(h) { return chainOf(headOf(h), [{ n: headOf(h), o: 0 }]); } }),
  };
  const wf = new Function(...Object.keys(sdk), src)(...Object.values(sdk));
  void wf;
  const name = src.match(/workflow\('[^']+', '([^']+)'/)[1];
  const out = nodes.map((n) => {
    const c = n.config; const o = { id: crypto.createHash('md5').update(which + n.name).digest('hex').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*$/, '$1-$2-$3-$4-$5'), name: n.name, type: n.type, typeVersion: n.version, position: c.position || [0, 0], parameters: c.parameters || {} };
    for (const k of ['onError', 'retryOnFail', 'maxTries', 'waitBetweenTries']) if (c[k] !== undefined) o[k] = c[k];
    if (c.credentials) { o.credentials = {}; for (const [k, v] of Object.entries(c.credentials)) o.credentials[k] = { id: '', name: v.__cred || v.name }; }
    return o;
  });
  return { name: name + ' (v56, import then attach credentials, keep inactive)', nodes: out, connections: conns, active: false,
    settings: { executionOrder: 'v1', timezone: 'Asia/Kolkata', saveManualExecutions: false, saveDataSuccessExecution: 'none', saveDataErrorExecution: 'none' }, pinData: {}, meta: { templateCredsSetupCompleted: false } };
}
for (const w of ['all']) {
  const j = build(w);
  fs.writeFileSync(path.join(here, 'workflows', FILES[w] + '.json'), JSON.stringify(j, null, 2) + '\n');
  console.log(FILES[w], j.nodes.length, 'nodes');
}
