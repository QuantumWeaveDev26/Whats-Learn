# Dependency security check repair

The latest main-branch Actions run stopped at `pnpm audit --audit-level low`, before application tests ran. It reported React Server Components, Satori and minimatch advisories. A fresh audit also reported the November 16 Next.js advisory.

- Align React, React DOM and React Server Components at 19.2.9.
- Update Next.js to 16.4.5.
- Resolve vulnerable minimatch paths to 11.0.1 and vinext's OG dependency to @vercel/og 1.0.3, which carries patched Satori.
- Regenerate the lockfile and raise the existing installed-version regression floors.
- Retain audit gates, strict dependency build controls and the seven-day release-age policy. The release-age exceptions are limited to the exact reviewed React patch versions.

Advisories: [React Server Components](https://github.com/advisories/GHSA-xqc2-xf4c-x3h3), [Satori](https://github.com/advisories/GHSA-wx4j-mvgx-mqwp), [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249), [Next.js](https://github.com/advisories/GHSA-mfr8-8qww-v76h).

Local validation: clean frozen-lockfile install and supply-chain verification; complete and production pnpm audits; sandbox npm audit; 252 regression tests, billing setup/provider suites and 83 billing/learner checks; 103 app checks and two sandbox service checks; 28 in-memory migrations; TypeScript; production build and standalone packaging. These checks used synthetic fixtures and no production learner, payment or database mutations.

No page, styling, feature, billing behavior or workflow gate was changed. Historical commit failures remain historical evidence; the new commit must receive a fresh Actions run.
