# Dependency advisory review — 23 October 2026

The screenshot was treated as a report to investigate, not evidence of a breach. A fresh registry-backed `pnpm audit --json` reproduced **3 critical, 32 high, 27 moderate and 9 low findings** in the original lockfile.

## Remediation

- Next.js 16.3.4 → **16.4.1**, covering the three reported critical advisory ranges: [ImageResponse](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j), [SVG image optimisation](https://github.com/advisories/GHSA-2464-fhr4-w9xw), and [typed-array cache responses](https://github.com/advisories/GHSA-673q-mjm6-r5xr).
- React, React DOM and React Server DOM Webpack → **19.2.8**; ESLint's Next config → **16.4.1**; Vite → **8.1.6**. Existing framework peer ranges admit these versions; no framework migration was made.
- Pinned patched transitive versions for esbuild, ws, undici, js-yaml, Babel core, brace-expansion, browserslist, fflate, baseline-browser-mapping, image-size, fast-uri, source-map-js and sharp in `pnpm-workspace.yaml`. The existing release-age delay, strict build-script policy, approved build list and store protections remain.
- Regenerated the lockfile and installed it frozen into a separate dependency tree for this worktree. The junction to the original checkout was detached; the original checkout's dependencies were preserved.
- CI now rejects high/critical production advisories and critical advisories across the entire tree. No advisory IDs are ignored or hidden.

## Fresh audit result

| Scope | Critical | High | Moderate | Low |
| --- | ---: | ---: | ---: | ---: |
| Production dependency graph | 0 | 0 | 0 | 0 |
| Complete dependency graph, including development tools | 0 | 1 | 0 | 0 |

The remaining finding is [`braces` 3.0.3 / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), reached through build/lint tooling such as fast-glob and micromatch. The reviewed advisory lists **no patched version**. It remains visible in the full audit; it has not been declared fixed, replaced with an incompatible package, or assigned a fabricated patched version. Registry dependency classification alone does not prove exploitability or that every bundled code path is absent.

Production audit success is a dependency check, not a penetration test or a public-launch certification. Post-install regression/build results, deployed release marker and runtime browser checks must be verified separately. Node.js runtime patching is separate from these package updates. The full project sandbox service, if activated later, needs its own isolated runtime review.

A separate `npm audit --omit=dev` for `services/project-sandbox` also returned zero advisories. This does not activate or operationally certify that service.
