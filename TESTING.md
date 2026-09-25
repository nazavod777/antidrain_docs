# Testing

## Start here

```bash
npm run test:for                          # the working tree against HEAD
npm run test:for -- docs/ru/glossary.md   # these paths instead
npm run test:for -- --why docs/index.md
npm run test:for -- --audit               # is the map still true?
```

It prints a plan by tier and runs nothing. `npm run build` is still the gate here and nothing in
this file replaces it. Paths are taken as typed: a trailing slash, a leading `./`, a backslash or an
absolute path all resolve the same way, and naming a directory reaches the rules for the files
inside it as well as those above it.

The command is `test:for` in all three repositories, even though every check in this one is called
`check:`. One command has to work in any of the three checkouts, and a local synonym would be a
second name for one thing. The output speaks the local language: it prints `npm run check:layout`,
and it calls these things checks. The headings of this file are the same seven in all three, in this
order; `INV-13` in `../AGENTS.md` is what holds that.

## What this buys you

Not seconds. `npm run lint` finishes in about six tenths of a second, so narrowing it saves nothing
worth measuring. Three other things:

- **Escalation.** It is the only thing that will tell you that editing `theme/tokens.css` also needs
  `og-image` — the social card is drawn from those very variables — or that a change to
  `docs/.vitepress/pages.ts` reaches `check:slugs`, `check:urls` and `check:layout` at once, because
  all three import it and none keeps a second copy. Nobody reliably remembers the expensive
  direction, and the cheap direction is the one people guess.
- **Radius.** `docs/index.md` is read by no structural check at all: `check:parity`, `check:slugs`
  and `check:anchors` each scan `docs/ru/` and `docs/en/` and nothing else. A green `npm run lint`
  after editing the language picker has looked at exactly none of it. The map answers `check:layout`
  and `build`, because a real browser over `dist/` is the entire coverage that page has.
- **Discoverability.** A wrong answer is a red audit, not a silent omission. `--audit` runs inside
  `npm run lint`, so a map that stopped describing the repository fails in the fast loop and in CI.
  Prose in `AGENTS.md` cannot fail.

## The tiers

Generated from `scripts/testMap.mjs` — edit the map, then `npm run test:for -- --write`. Editing the
block by hand fails the audit as `table-drift`, in CI as well as locally.

<!-- test-map:start -->

#### Structural

Reads the source and renders nothing. Tenths of a second, no build, no browser — the fast loop, and where a mistake is cheapest to find.

| Script | What it covers | Cost |
| --- | --- | --- |
| `check:contrast` | every text/surface pair in both themes against WCAG, read out of tokens.css and light.css | ~0.1 s |
| `check:slugs` | every heading anchor the deployed site already serves, against the two fixtures | ~0.15 s |
| `check:parity` | the RU and EN trees structurally 1:1 — headings, tables, images, callouts by type and what they wrap | ~0.1 s |
| `check:anchors` | every in-content #fragment resolves to a heading that exists | ~0.15 s |
| `test:for` | the map itself, under --audit: every path claimed, every check reachable, the tier table in TESTING.md current | ~0.05 s, ~0.3 s through npm |
| `lint` | every structural check above, in one command; the fast loop, budgeted under a second | ~0.6 s |

#### Rendered

Needs a built dist/, and for the layout check a real Chromium. Tens of seconds, not tenths, and the only thing that can say what a page actually looks like.

| Script | What it covers | Cost |
| --- | --- | --- |
| `check:urls` | every live URL, including the legacy .html redirect stubs, is backed by a file in dist/ | ~0.15 s, once dist exists |
| `check:layout` | a real browser over every page URL in dist/, eight navigations at a time: the ten layout types at six widths in dark and the two extremes (390, 1440) in light, because layout does not vary by palette, and every other page swept at 390/1024/1440 in dark and 390/1440 in light. Sideways scroll, touch targets, axe at 390 and 1440 in both themes, console errors, reduced motion, forced colours read as decoded pixels, and a probe proving a mid-run failure still exits | ~39 s, once dist exists — most of the build |
| `build` | lint, the VitePress build with its dead-link check, the redirect stubs, check:urls and check:layout — the gate | ~42 s |

#### Local only

Reaches outside this checkout — into ../antidrain_site, or into a browser driving the live product. CI runs none of these, so nothing but you will notice.

| Script | What it covers | Cost |
| --- | --- | --- |
| `tokens:check` | the vendored token block against ../antidrain_site, byte for byte. ANTIDRAIN_SITE overrides the path | ~0.1 s |
| `screenshots` | regenerates every UI screenshot by driving the site's own dev server. Wipes docs/public/screenshots/ first | not measured |
| `og-image` | regenerates docs/public/og-image.jpg from tokens.css and the wordmark, in a browser, offline | not measured |

#### Manual

What no check here can reach: whether the words are true, whether a beginner can act on them, and what the result looks like to a person.

| Check | Run when | Costs |
| --- | --- | --- |
| `product-vocabulary` | the diff touches docs/ru/, docs/en/ or the term list in AGENTS.md | ~10 min against the site checkout |
| `bilingual-read` | the diff touches docs/ru/ or docs/en/ | ~5 min per page pair |
| `beginner-path` | the diff changes instructional text in either locale | ~5 min |
| `rendering` | the diff changes anything a person looks at | ~5 min |
| `generated-images` | the diff touches docs/public/screenshots/ or docs/public/og-image.jpg | ~3 min |

<!-- test-map:end -->

## Triggers

Every trigger in this file is **a condition on the diff**, never a frequency and never a judgement.
"when the diff touches `docs/ru/`" is a trigger. "when it seems risky", "before a release",
"periodically" are not: nobody can tell whether they were honoured, so they are decoration.

Two consequences of that rule are worth stating outright.

**Both locales change together.** `docs/ru/` and `docs/en/` carry deliberately identical rules, and
the audit warns (`unlocalised-rule`) on any rule that claims one locale tree without the other. A
figure, a step name or a label updated in one language and not the other is drift; `check:parity`
exists because that has happened.

**A targeted `check:layout` run is not the gate.** `--page <url>` and `--changed <path>` narrow the
set of pages, never the set of checks per page, and the run prints what it did not do. `DEPLOY.md`
§ Named gaps records both halves: the widths at which the gate only sweeps the pages that are not
layout types, and what a narrowed run structurally leaves out. The gate opens every page URL in
`pages.ts`. Every rule that names `check:layout` or `check:urls` names `build` next to it, and the
audit fails as `build-order` on one that does not: both read `docs/.vitepress/dist/` and neither has
any idea how old it is, so a plan that skips the build is a plan that passes against the previous
version of the site.

`check:layout` also proves its own teardown before it measures anything: a child process runs real
navigations over `dist/`, one of them throws with Chromium and the server both up, and the child has
to exit non-zero on its own within 30 seconds. That probe is part of every real run, targeted or
not, because the failure it guards — a gate that hangs instead of failing — would stall CI until its
timeout. It needs a browser, so it lives in the real run and not in the `--self-test`, which proves
the probe's verdict and the worker pool with no browser at all.

Once `build` is in a plan, the plan stops printing `check:urls` and `check:layout` at all: there is
no position for them. It then lists everything the gate runs — those two, `lint`, and through `lint`
the whole structural tier — under "also run by `npm run build`", so that nothing the gate performs
can appear under what the run did not check. `lint` itself stays in the plan, because it reads no
`dist/` and 0.6 seconds before a forty-second gate is exactly the order `AGENTS.md` asks for.
`build-drift` is what keeps that division true.

## Manual checks

Five items, and each states what it proves that **nothing automated can**. The trigger is the diff;
the procedure lives in the document the item points at, next to the rest of that subject, so there
is no second copy to rot. `manual-drift` fails the audit if one of those documents disappears.

The three that fire on a page change are not redundant. `check:parity` compares structure and never
wording, so `bilingual-read` is the only thing that catches a sentence added to one language alone.
`product-vocabulary` is the reason this repository exists as a separate one: no script knows what
the product currently calls a thing, and a second name for one concept is a defect (`INV-5`), as is
a workflow step out of the site's order (`INV-6`). `beginner-path` holds the acceptance criterion in
`AGENTS.md` — a change is done when a reader with no blockchain knowledge, reading mid-incident, can
act on it, and nothing here measures that.

The rule written into all five: when an item becomes checkable, delete it and land the check in the
same change. A manual list that only grows is a list nobody reads.

## When the map is wrong

`npm run test:for -- --audit` fails on twelve kinds of wrong:

| Code | What it means |
| --- | --- |
| `script-missing` | the map names a script `package.json` does not have, or a tier that is not a tier |
| `dead-prefix` | a rule, gap or manual prefix matches nothing this repository owns |
| `unmapped-source` | a path claimed by no rule and no documented gap |
| `unreachable-check` | a check's own source file is claimed by a rule that names nothing which runs it |
| `build-order` | a rule names a check that reads `dist/` without naming `build` |
| `build-drift` | a check marked `inBuild` that the `build` command no longer names |
| `lint-chain-drift` | the structural tier and the `lint` command in `package.json` disagree |
| `self-test-drift` | a check marked as shipping a `--self-test` whose npm command is not the pair: that self-test, and then a real run of the same script |
| `stale-no-tests` | a documented gap has since gained code, so it is no longer the prose it claimed to be |
| `contradicted-gap` | a path is documented as having no check *and* claimed by a rule |
| `manual-drift` | a manual check points at a document that is gone |
| `table-drift` | the tier table above no longer matches `scripts/testMap.mjs` |

`unreachable-check` is the class that keeps `lint` honest. Every `.mjs` under
`docs/.vitepress/scripts/` is run by exactly one npm script, and the map records which in the
script's `implements` field. `lint` has none, because it is an aggregate: a rule that answered
`lint` for a change to `check-layout.mjs` would be claiming the path while running the layout check
never — the fast loop does not contain it. `build` does have one, because `html-stubs.mjs` is wired
inline into `build` and has no npm name of its own.

`build-order` is the one class that is about the *shape* of an answer rather than its truth. It
exists because a stale `dist/` produces a green run about the previous version of the site, which is
worse than no run at all: it looks like evidence.

`build-drift` is its other half, and it guards a *silence*. `lint`, `check:urls` and `check:layout`
are marked `inBuild` — the three the `build` command names itself — and the map derives two
different things from that mark, which is the distinction the first version of this class got wrong.
**What the gate runs** is the closure: those three, plus the structural tier that `lint` aggregates,
and none of it may ever be printed as unchecked. **What the plan stops printing** is narrower: only
`check:urls` and `check:layout`, because they read `dist/` and no position works — before the build
they measure the previous version of the site, after it they repeat the browser pass the gate has
just spent. Both readings are only safe while the build really does run them, and both are checked as
steps rather than as substrings: `npx eslint .` contains the word `lint`, and a substring test would
have let this repository swap out its fast loop while the plan went on calling it covered.

`lint-chain-drift`, `self-test-drift` and `build-drift` are the three places the map restates
something that lives in `package.json`, so all three are checked rather than trusted. `self-test-drift`
demands the whole pair — `node X --self-test && node X` — because each half without the other is
green and empty: a command that lost the self-test no longer proves the check can fail, and one that
lost the real run grades its own fixtures and never the repository. It also requires the self-test
to come first, and it looks in both directions, since removing the mark from the map disables the
invariant for that check just as effectively as removing the flag from the command.

`lint-chain-drift` reads the fast loop the same way, and for one script it has to read the flags too.
Four checks are in the chain under their npm names; the map audit is there as a bare
`node scripts/testFor.mjs --audit`, because `npm run` costs more in process startup than the audit
costs to run. Without `--audit` that step prints a plan and grades nothing, so the chain has to name
the invocation the map itself would tell you to type, not merely the file.

It also warns where a machine cannot decide: `unlocalised-rule` for a rule that claims `docs/ru/`
without `docs/en/` or the reverse, and `empty-rule` for a rule that selects nothing. A one-sided
locale rule can be deliberate — a fixture that genuinely exists in one language only — and only a
person can tell that apart from the edit that forgot the second language.

The table-drift comparison lives in `auditMap` and must stay there. `npm run test:for -- --write`
runs the map's self-test first, without the flag, so a stale-table assertion inside the self-test
would make the one command that regenerates the table unreachable. The site repository tried it and
deadlocked.

A resolver that answers `2` is telling you a path exists that no rule claims. Add the rule, or add a
`NO_TESTS` entry with the reason. Both are three lines in `scripts/testMap.mjs`. Neither is
optional: an unclaimed path is how a page quietly stops being checked.

Two unclaimed paths deliberately do not answer `2`, because in neither case is there a rule to add.
One that no longer exists on disk prints as deleted — otherwise moving a directory would be
impossible to finish, since the old prefix is dead and the new one unmapped whichever order you edit
in. One that `git` ignores prints as generated: `docs/.vitepress/dist/` is the build's output, and a
rule for it would only restate the rule for the build.
