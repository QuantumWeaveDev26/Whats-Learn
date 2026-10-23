# Dependency advisory review — 23 October 2026

The screenshot was treated as a report to investigate, not evidence of a breach. A fresh registry-backed `pnpm audit --json` reproduced **3 critical, 32 high, 27 moderate and 9 low findings** in the original lockfile.

## Remediation

- Next.js 16.3.4 → **16.4.1**, covering the three reported critical advisory ranges: [ImageResponse](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j), [SVG image optimisation](https://github.com/advisories/GHSA-2464-fhr4-w9xw), and [typed-array cache responses](https://github.com/advisories/GHSA-673q-mjm6-r5xr).
- React, React DOM and React Server DOM Webpack → **19.2.8**; ESLint's Next config → **16.4.1**; Vite → **8.1.6**. Existing framework peer ranges admit these versions; no framework migration was made.
- Pinned patched transitive versions for esbuild, ws, undici, js-yaml, Babel core, brace-expansion, browserslist, fflate, baseline-browser-mapping, image-size, fast-uri, source-map-js and sharp in `pnpm-workspace.yaml`. The existing release-age delay, strict build-script policy, approved build list and store protections remain.
- Regenerated the lockfile and installed it frozen into a separate dependency tree for this worktree. The junction to the original checkout was detached; the original checkout's dependencies were preserved.
- CI now rejects high/critical production advisories and critical advisories across the entire tree. No advisory IDs are ignored or hidden.

## Earlier v8.1 audit result (superseded below)

| Scope | Critical | High | Moderate | Low |
| --- | ---: | ---: | ---: | ---: |
| Production dependency graph | 0 | 0 | 0 | 0 |
| Complete dependency graph, including development tools | 0 | 1 | 0 | 0 |

The remaining finding is [`braces` 3.0.3 / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), reached through build/lint tooling such as fast-glob and micromatch. The reviewed advisory lists **no patched version**. It remains visible in the full audit; it has not been declared fixed, replaced with an incompatible package, or assigned a fabricated patched version. Registry dependency classification alone does not prove exploitability or that every bundled code path is absent.

Production audit success is a dependency check, not a penetration test or a public-launch certification. Post-install regression/build results, deployed release marker and runtime browser checks must be verified separately. Node.js runtime patching is separate from these package updates. The full project sandbox service, if activated later, needs its own isolated runtime review.

A separate `npm audit --omit=dev` for `services/project-sandbox` also returned zero advisories. This does not activate or operationally certify that service.

## Local defence for the remaining development advisory

A reproducible pnpm patch in `patches/braces@3.0.3.patch` now bounds parser nesting to 128 and adds an iterative AST preflight before compile, expand and stringify. The preflight rejects excessive depth, oversized trees and cycles before recursive walkers run. Normal file/glob patterns, numeric ranges, escaped/quoted literal braces and shared acyclic AST leaves retain their behaviour.

Eleven focused regressions check the installed dependency reached through the actual build-tool chain, including an 8,001-character pattern with 4,000 nested braces and direct deeply nested ASTs. The supplied payloads produce controlled syntax errors rather than stack exhaustion. The patch is integrity-bound in the frozen lockfile and reapplied in CI/hosting installs.

This is a local mitigation for the reported recursion issue, not an upstream patched release or a guarantee about every possible regular-expression complexity issue. The complete registry audit still reports one high finding for version 3.0.3; it is intentionally not suppressed. Hostinger may continue to display that upstream-version finding until a patched upstream release or a manual assessment recognises the local defence. Production and the separate sandbox service audit remain zero at all severities.

## v9: removed the remaining vulnerable package

The current release removes `braces` and `micromatch` from both the lockfile and the installed dependency graph. The old `braces` patch is retired. No package has been renamed to hide an advisory and no advisory ID is ignored.

Both consumers now use fast-glob 3.3.3 with the integrity-bound `patches/fast-glob@3.3.3.patch`. Scanning and regex matching use picomatch 2.3.2 directly, the same API previously forwarded by micromatch. Brace expansion uses brace-expansion 5.0.12 with explicit input, depth, rewrite and result limits. Quoted text and escaped glob characters are protected and restored. Oversized expansions fail rather than silently dropping source files. The installed package manifest and pnpm resolution policy both declare the replacement dependencies so standalone tracing uses the same graph.

Focused checks compare 21 expansion patterns against the previous implementation and scan real fixture files through synchronous, asynchronous and streaming APIs, including negation, extglobs, hidden files and escaped brackets. Both the Next lint plugin and the Vinext build plugin resolve this implementation. Deeply nested strings, mixed closing symbols, NUL input and combinatorial/range expansion are bounded.

Fresh complete-tree and production audits report **0 critical, 0 high, 0 moderate and 0 low**. CI now rejects advisories at every severity across the complete graph. Supply-chain age and build-script protections are preserved. The upstream braces advisory still has no fixed release; this project no longer installs the affected package.
