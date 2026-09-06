---
description: "Run this repository's declared gate — the fast lint by default, the full build on `full`."
argument-hint: "[full]"
allowed-tools: Bash, Read
---

Tier: **$ARGUMENTS** — empty means the fast loop, `full` means the build.

| $ARGUMENTS | run |
| --- | --- |
| *(empty)* | `npm run lint` |
| `full` | `npm run build` |

This file names the scripts and never their contents. `package.json` is the only place a gate's
steps are written down, so a renamed step cannot leave a stale command line here — `CR-12` and
`INV-10` in `antidrain_web/AGENTS.md` are what hold that.

`npm run lint` takes about a second and does not build; use it while editing. `npm run build` runs
the lint first and then the checks that need a rendered site, so it is the only thing that lets you
report a change as done.

**`build` needs a Chromium.** If Playwright's own browser is missing, point
`PLAYWRIGHT_CHROMIUM_PATH` at a system one rather than skipping the step — a build that never
rendered the site has not checked the layout.

## While iterating

`npm run test:for` answers which checks can see what you just changed, and prints what it is
leaving out. `TESTING.md` is the tier table behind that answer; do not reconstruct it from memory.
Nothing it prints replaces the gate above — only `npm run build` renders the site.

If it exits `2`, a path exists that the map does not claim — fix `scripts/testMap.mjs` before
trusting any narrow run, because until then the plan is a guess. The audit runs inside
`npm run lint`, so a stale map goes red in the fast loop rather than answering confidently and
wrongly.

## What this gate cannot see

It proves the site builds, that no already-deployed anchor stopped resolving, that the RU and EN
trees still match, and that the rendered layout holds. It says nothing about whether the words are
*true* — whether a step, an action or a label still matches what the site does. That is `INV-5` and
`INV-6`, and `/parity` is the discipline for it.

`vitepress preview` also resolves extensionless URLs differently from GitHub Pages; `DEPLOY.md` has
the way to serve `dist` as production does. A link that works under `preview` is not evidence.

## Reporting

Show the real output. On red, classify every failure as **introduced by this change**,
**pre-existing** or **flaky**, and say which. On green, name the command you actually ran.

Green here is not permission to publish. A push to `origin` triggers the deploy workflow and
updates the live site; that is a separate, deliberate act.
