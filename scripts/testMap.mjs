import { execFileSync } from "node:child_process";

/**
 * Which checks can see a change to a given path.
 *
 * `npm run build` is still the gate here and nothing in this file replaces it. What the map buys is
 * the three things the prose in `AGENTS.md` and `DEPLOY.md` could never buy:
 *
 * - **Escalation.** It is the only thing that will tell you that editing `theme/tokens.css` also
 *   needs `og-image` — the social card is drawn from those very variables — or that `docs/index.md`
 *   is reached by no fast-loop check at all, because `check:parity`, `check:slugs` and
 *   `check:anchors` each read `docs/ru/` and `docs/en/` and nothing else. Nobody reliably remembers
 *   the expensive direction, and the cheap direction is the one people guess.
 * - **Radius.** `npm run lint` takes well under a second, so the temptation is to treat a green lint
 *   as an answer. For a change under `docs/.vitepress/theme/` it is not an answer at all: only a
 *   real browser over a real `dist/` can say what the token draws. The map says so.
 * - **Discoverability.** A wrong answer here is a red audit — `npm run test:for -- --audit`, which
 *   runs inside `npm run lint` — not a silent omission. Prose cannot fail.
 *
 * This is JavaScript and not JSON because every table in this ecosystem carries its reasoning next
 * to the data. A `why` that lives in a separate document is a `why` that rots. Each entry states one.
 *
 * Matching is by path prefix and takes the **union of every rule that matches**, never the first.
 * `docs/.vitepress/theme/tokens.css` is theme CSS *and* the one vendored file, and both rules have
 * something to say about it.
 *
 * The three repositories each carry their own copy of this pair of scripts. That is deliberate —
 * `antidrain_web/AGENTS.md` GAP-4 — and not debt to be paid off with a shared package.
 */

/** Order matters: it is the order `test:for` prints, cheapest and most structural first. */
export const TIERS = [
  {
    id: "structural",
    title: "Structural",
    why: "Reads the source and renders nothing. Tenths of a second, no build, no browser — the fast loop, and where a mistake is cheapest to find.",
  },
  {
    id: "rendered",
    title: "Rendered",
    why: "Needs a built dist/, and for the layout check a real Chromium. Minutes, not seconds, and the only thing that can say what a page actually looks like.",
  },
  {
    id: "local",
    title: "Local only",
    why: "Reaches outside this checkout — into ../antidrain_site, or into a browser driving the live product. CI runs none of these, so nothing but you will notice.",
  },
  {
    id: "manual",
    title: "Manual",
    why: "What no check here can reach: whether the words are true, whether a beginner can act on them, and what the result looks like to a person.",
  },
];

/**
 * Every script the map is allowed to name, with the tier it belongs to and what it costs.
 *
 * `cost` is a measured wall-clock figure on this machine, or `null` where it has not been measured —
 * an invented number is worse than an absent one, because it gets quoted.
 *
 * `implements` names the one `.mjs` the script executes. It is what lets the audit prove a check's
 * own source is reachable: a rule that answers `lint` for a change to `check-contrast.mjs` claims
 * the path while running the contrast check only by accident of the chain, and that distinction is
 * invisible from the script name alone. `lint` has no `implements` precisely because it is an
 * aggregate; `build` has one because the redirect-stub script is wired inline into it and has no
 * npm name of its own. The audit fails if a named file is not there, so renaming a check's source
 * without renaming it here is caught rather than assumed.
 *
 * `selfTests` marks the scripts this repository's invariant applies to: a `--self-test` run
 * immediately before the real run, inside the same npm script name. The audit checks it against
 * `package.json` rather than trusting this column — both halves of it, because a command that runs
 * the self-test and nothing else passes every check while checking nothing.
 *
 * `inBuild` marks the checks the `build` command **names itself** — `lint`, `check:urls`,
 * `check:layout`. Following the extension's precedent, the audit proves the build command really
 * names each of them (`build-drift`). Two different things are then derived from that mark, and
 * conflating them was the first version of this:
 *
 * - **What the gate runs**, `runsInsideBuild()`: the marked three plus, through `lint`, the whole
 *   structural tier. Nothing may be reported as unchecked while the plan's own gate runs it.
 * - **What the plan does not repeat**, the marked ones that read `dist/`. For those there is no
 *   order that works — before the build they measure the previous version of the site, after it
 *   they repeat 105 seconds the gate has just spent. `lint` is marked and is *not* dropped: it
 *   costs 0.6 s, reads no `dist/`, and running it first is exactly what `AGENTS.md` asks for.
 *
 * `command` is the invocation to print when `npm run <name>` is not the thing that does the work.
 * `test:for` is the only one: bare, it prints another plan, and the run that audits the map is
 * `npm run test:for -- --audit`. The name stays the script's own — the self-test asserts every
 * `command` begins with `npm run <name>`, so the printed line can never name a different script.
 */
export const SCRIPTS = [
  {
    name: "check:contrast",
    tier: "structural",
    selfTests: true,
    implements: "docs/.vitepress/scripts/check-contrast.mjs",
    covers: "every text/surface pair in both themes against WCAG, read out of tokens.css and light.css",
    cost: "~0.1 s",
  },
  {
    name: "check:slugs",
    tier: "structural",
    selfTests: true,
    implements: "docs/.vitepress/scripts/check-slugs.mjs",
    covers: "every heading anchor the deployed site already serves, against the two fixtures",
    cost: "~0.15 s",
  },
  {
    name: "check:parity",
    tier: "structural",
    selfTests: true,
    implements: "docs/.vitepress/scripts/check-parity.mjs",
    covers: "the RU and EN trees structurally 1:1 — headings, tables, images, callouts by type and what they wrap",
    cost: "~0.1 s",
  },
  {
    name: "check:anchors",
    tier: "structural",
    selfTests: true,
    implements: "docs/.vitepress/scripts/check-anchors.mjs",
    covers: "every in-content #fragment resolves to a heading that exists",
    cost: "~0.15 s",
  },
  {
    name: "test:for",
    tier: "structural",
    selfTests: true,
    implements: "scripts/testFor.mjs",
    // Without the flag this prints a plan, which is not a check of anything. The plan has to name
    // the run that audits the map, or following it means running nothing.
    command: "npm run test:for -- --audit",
    covers: "the map itself, under --audit: every path claimed, every check reachable, the tier table in TESTING.md current",
    cost: "~0.05 s, ~0.3 s through npm",
  },
  {
    name: "lint",
    tier: "structural",
    inBuild: true,
    covers: "every structural check above, in one command; the fast loop, budgeted under a second",
    cost: "~0.6 s",
  },
  {
    name: "check:urls",
    tier: "rendered",
    selfTests: true,
    inBuild: true,
    implements: "docs/.vitepress/scripts/check-urls.mjs",
    covers: "every live URL, including the legacy .html redirect stubs, is backed by a file in dist/",
    cost: "~0.15 s, once dist exists",
  },
  {
    name: "check:layout",
    tier: "rendered",
    selfTests: true,
    inBuild: true,
    implements: "docs/.vitepress/scripts/check-layout.mjs",
    covers: "a real browser over dist/ at six widths in dark and the two extremes (390, 1440) in light, because layout does not vary by palette: sideways scroll, touch targets, axe at those two widths, console errors, reduced motion, and forced colours read as decoded pixels",
    cost: "~105 s, once dist exists — almost the whole build",
  },
  {
    name: "build",
    tier: "rendered",
    selfTests: true,
    implements: "docs/.vitepress/scripts/html-stubs.mjs",
    covers: "lint, the VitePress build with its dead-link check, the redirect stubs, check:urls and check:layout — the gate",
    cost: "~110 s",
  },
  {
    name: "tokens:check",
    tier: "local",
    selfTests: true,
    implements: "docs/.vitepress/scripts/check-tokens.mjs",
    covers: "the vendored token block against ../antidrain_site, byte for byte. Needs ANTIDRAIN_SITE",
    cost: "~0.1 s",
  },
  {
    name: "screenshots",
    tier: "local",
    selfTests: true,
    implements: "docs/.vitepress/scripts/shoot-screenshots.mjs",
    covers: "regenerates every UI screenshot by driving the site's own dev server. Wipes docs/public/screenshots/ first",
    cost: null,
  },
  {
    name: "og-image",
    tier: "local",
    selfTests: true,
    implements: "docs/.vitepress/scripts/shoot-og-image.mjs",
    covers: "regenerates docs/public/og-image.jpg from tokens.css and the wordmark, in a browser, offline",
    cost: null,
  },
];

/**
 * One rule per check script, not one for the `scripts/` directory.
 *
 * A directory prefix could only ever answer "run the lint chain", which is precisely the advice this
 * map exists to replace: editing `check-layout.mjs` has to run `check:layout`, and no amount of
 * green lint says anything about it. Restating the pairing here is what lets `auditMap` prove that
 * every check in this repository can be reached from a change to its own source.
 */
const CHECK_SCRIPT_RULES = [
  ["check-contrast.mjs", "check:contrast"],
  ["check-slugs.mjs", "check:slugs"],
  ["check-parity.mjs", "check:parity"],
  ["check-anchors.mjs", "check:anchors"],
  ["check-urls.mjs", "check:urls"],
  ["check-layout.mjs", "check:layout"],
  ["check-tokens.mjs", "tokens:check"],
  ["shoot-screenshots.mjs", "screenshots"],
  ["html-stubs.mjs", "build"],
].map(([file, script]) => {
  // A check that reads dist/ is meaningless against a stale one, so its own rule has to reach the
  // build as well. Without this, editing check-layout.mjs would resolve to a run over whatever
  // happened to be in dist/ from last time — green, and about the previous version of the site.
  const readsDist = script !== "build" && SCRIPTS.find((entry) => entry.name === script)?.tier === "rendered";

  return {
    prefix: `docs/.vitepress/scripts/${file}`,
    scripts: readsDist ? [script, "build"] : [script],
    why:
      `Run by ${script}, and by nothing else. Its own --self-test goes first inside that same npm script name, so a check that quietly stopped checking shows up as a red self-test.` +
      (readsDist ? " It reads dist/, so the build has to come first or the run is about the previous version of the site." : ""),
  };
});

/**
 * Path prefix → the checks that can see a change there.
 *
 * A prefix ending in `/` is a directory; anything else is an exact path. Every path this repository
 * owns must be matched by a rule here or be listed in `NO_TESTS`, and the audit fails on any that is
 * neither.
 */
export const RULES = [
  {
    prefix: "docs/ru/",
    scripts: ["check:parity", "check:slugs", "check:anchors", "check:layout", "build"],
    why: "A locale page is checked four ways and only ever as half of a pair: parity against its English twin, slugs against the anchors already deployed, anchors for its own #fragments, and a real browser for the shape the markdown produces.",
  },
  {
    prefix: "docs/en/",
    scripts: ["check:parity", "check:slugs", "check:anchors", "check:layout", "build"],
    why: "Same as docs/ru/. The pair is the unit of change here, so the two rules are deliberately identical.",
  },
  {
    prefix: "docs/index.md",
    scripts: ["check:layout", "build"],
    why: "The language picker is the one page no structural check reads: parity, slugs and anchors all scan docs/ru/ and docs/en/ only. A browser over dist/ is the entire coverage it has.",
  },
  {
    prefix: "docs/.vitepress/theme/tokens.css",
    scripts: ["check:contrast", "tokens:check", "og-image", "check:layout", "build"],
    why: "Vendored byte-identically from the site (INV-7), so tokens:check is what proves it still is. The contrast check reads the values, the social card is drawn from them, and only a real engine shows what the token draws.",
  },
  {
    prefix: "docs/.vitepress/theme/light.css",
    scripts: ["check:contrast", "check:layout", "build"],
    why: "The second theme's values. Both themes are mandatory and both are checked, in the fast loop for contrast and in the browser for layout.",
  },
  {
    prefix: "docs/.vitepress/theme/",
    scripts: ["check:layout", "build"],
    why: "The rest of the theme is layout, prose and the VitePress bridge: no static check reads them, and a rendered page is the only evidence.",
  },
  {
    prefix: "docs/.vitepress/pages.ts",
    scripts: ["check:slugs", "check:urls", "check:layout", "build"],
    why: "The one page list. config.ts and three checks import it and none keeps a second copy, so an edit here moves the sidebar, the rewrites, the URL contract and the anchor contract at once.",
  },
  {
    prefix: "docs/.vitepress/slugify.ts",
    scripts: ["check:slugs", "check:anchors", "build"],
    why: "The one transliteration. It decides what every Cyrillic heading's URL is, so changing it silently rewrites anchors people have already bookmarked; the two checks that import it are what catch that.",
  },
  {
    prefix: "docs/.vitepress/config.ts",
    scripts: ["check:urls", "check:layout", "build"],
    why: "Navigation, locales, SEO and the URL rewrites. Nothing static reads it — the build is what executes it, and the URL contract is what notices a rewrite that changed.",
  },
  ...CHECK_SCRIPT_RULES,
  {
    prefix: "docs/.vitepress/scripts/fixtures/",
    scripts: ["check:slugs"],
    why: "The recorded anchor contracts. They exist to be compared against, so editing one by hand is exactly what the check is there to object to — re-record with `npm run check:slugs -- --record` instead.",
  },
  {
    prefix: "docs/.vitepress/scripts/shoot-og-image.mjs",
    scripts: ["og-image", "check:layout", "build"],
    why: "The one script here the generated rules above cannot describe, because their premise — run by one npm script and by nothing else — stopped being true of it. It owns `launchCandidates`, the rule about which Chromium a run is allowed to use, and `check-layout.mjs` imports that rather than keeping a second answer to the same question. So a change here can decide what the layout gate measures on, and check:layout reads dist/, which brings the build with it.",
  },
  {
    prefix: "docs/.vitepress/scripts/optimise-screenshots.py",
    scripts: ["screenshots"],
    why: "Spawned by shoot-screenshots.mjs as its last step and by nothing else; it converts the PNGs to WebP and deletes the originals, so the only way to exercise it is the generator that calls it.",
  },
  {
    prefix: "docs/public/antidrain-mark.png",
    scripts: ["og-image", "build"],
    why: "The wordmark the social card is composed from, as well as a shipped asset.",
  },
  {
    prefix: "docs/public/og-image.jpg",
    scripts: ["og-image", "build"],
    why: "Generated, not authored. Re-running the generator is what makes a change to it real; the build is the only thing that would notice it missing.",
  },
  {
    prefix: "docs/public/screenshots/",
    scripts: ["check:layout", "build"],
    why: "The pages carrying screenshots are among the ten layout types the browser pass opens, so a frame with different dimensions can change a page's shape.",
  },
  {
    prefix: "docs/public/",
    scripts: ["build"],
    why: "Icons, CNAME, .nojekyll and the favicons are copied into dist verbatim. Only a build can be wrong about them.",
  },
  {
    prefix: "scripts/",
    scripts: ["test:for"],
    why: "This map and its resolver. `test:for` runs its own self-test and then audits the map against the repository, so it is literally the check for them; the lint chain runs the same thing.",
  },
  {
    prefix: "TESTING.md",
    scripts: ["test:for"],
    why: "Its tier table is generated from scripts/testMap.mjs, and the audit is what compares the two. Editing the block by hand fails as table-drift.",
  },
  {
    prefix: "package.json",
    scripts: ["test:for", "lint", "build"],
    why: "Three contracts read it: the lint chain the audit reconstructs, the --self-test pairing every check owes, and the script names this map is allowed to print.",
  },
  {
    prefix: "package-lock.json",
    scripts: ["check:layout", "build"],
    why: "VitePress builds the site and axe-core is loaded into the page by the layout check, so a moved dependency shows up in one of those two and nowhere earlier.",
  },
];

/**
 * Paths with no automated check, each with the reason. The audit fails when one of these gains a
 * page or a check script, because at that point the entry is a lie rather than a documented gap.
 */
export const NO_TESTS = [
  {
    prefix: "AGENTS.md",
    why: "Prose about how to work here. It carries the normative term list, which no script can grade; `node ../scripts/check-ecosystem.mjs` checks its cross-repo claims and INV-10 checks that the npm scripts it names exist.",
  },
  { prefix: "CLAUDE.md", why: "Prose, derived from AGENTS.md. Same as AGENTS.md." },
  { prefix: "README.md", why: "Prose. INV-10 is the only thing that reads it, and it reads only the command names." },
  { prefix: "DEPLOY.md", why: "Prose about CI and the named gaps. Nothing here can grade a description of a gap." },
  { prefix: "DESIGN_SYSTEM.md", why: "Prose about the tokens. tokens:check grades the CSS; nothing grades the document about it." },
  { prefix: ".claude/", why: "Agent configuration. Not built, not imported, not shipped." },
  {
    prefix: ".github/workflows/",
    why: "It runs npm ci and npm run build and nothing else. CI failing to start is the only check there is.",
  },
  { prefix: ".gitignore", why: "Nothing to assert." },
  { prefix: ".nvmrc", why: "The Node version, pinned exactly. CI failing to start is the check." },
];

/**
 * The checks a human has to run, because nothing here structurally can: no script can read, none of
 * them knows what the product currently calls a thing, and none of them has ever been a frightened
 * beginner mid-incident.
 *
 * What this table adds is the trigger — which diff makes a manual pass required — and what each item
 * proves that no automated check does.
 */
export const MANUAL = [
  {
    id: "product-vocabulary",
    prefixes: ["docs/ru/", "docs/en/", "AGENTS.md"],
    run: "AGENTS.md § Product vocabulary — copy it, do not invent it, then the strings in ../antidrain_site/src/constants/translations/",
    proves: "Every step, action and label is the name the product actually uses, in both languages. A second name for one concept is a defect (INV-5), and the six step names and their order are the site's (INV-6).",
    required: "the diff touches docs/ru/, docs/en/ or the term list in AGENTS.md",
    costs: "~10 min against the site checkout",
    evidence: "which terms you checked and against which file in ../antidrain_site",
  },
  {
    id: "bilingual-read",
    prefixes: ["docs/ru/", "docs/en/"],
    run: ".claude/commands/parity.md — the read that check:parity cannot do",
    proves: "The two languages make the same claim in the same order. check:parity compares structure only and never wording, so a sentence added to one language alone passes it.",
    required: "the diff touches docs/ru/ or docs/en/",
    costs: "~5 min per page pair",
    evidence: "the pages read, and which language was behind",
  },
  {
    id: "beginner-path",
    prefixes: ["docs/ru/", "docs/en/"],
    run: "AGENTS.md § Project — the acceptance criterion, read as the audience it names",
    proves: "A reader with no blockchain knowledge, reading mid-incident, can take the next step. Accuracy is not the bar here and no check measures the bar that is.",
    required: "the diff changes instructional text in either locale",
    costs: "~5 min",
    evidence: "the step a newcomer would be stuck on, or that there was none",
  },
  {
    id: "rendering",
    prefixes: ["docs/ru/", "docs/en/", "docs/index.md", "docs/.vitepress/theme/", "docs/public/screenshots/"],
    run: "`npm run dev`, then look at 390 / 480 / 768 / 1024 / 1280 / 1440 in both themes",
    proves: "What the change actually looks like. check:layout opens 10 of the 33 page URLs and asserts only what someone wrote an assertion for; DEPLOY.md § Named gaps records both halves of that.",
    required: "the diff changes anything a person looks at",
    costs: "~5 min",
    evidence: "the widths and themes you looked at, and on which pages",
  },
  {
    id: "generated-images",
    prefixes: ["docs/public/screenshots/", "docs/public/og-image.jpg"],
    run: "README.md § Checks, then open every regenerated file before committing it",
    proves: "The frames show the right step in the right language, the UI is in the state the surrounding prose describes, and no real address or key was captured. Nothing here reads an image.",
    required: "the diff touches docs/public/screenshots/ or docs/public/og-image.jpg",
    costs: "~3 min",
    evidence: "which images you opened",
  },
];

const SCRIPT_NAMES = new Set(SCRIPTS.map((script) => script.name));
const TIER_IDS = new Set(TIERS.map((tier) => tier.id));

/** `docs/ru` and `docs/ru/` name the same directory; only one of them matches a prefix. */
export function withSlash(path) {
  return path.endsWith("/") ? path : `${path}/`;
}

/**
 * What a human or a shell actually types, turned into the form the rules are written in.
 *
 * `./docs/ru/faq.md` comes out of tab completion and out of `find`; `docs\ru\faq.md` comes out of
 * Windows; a trailing slash comes from typing a directory. All three name real paths and all three
 * used to resolve to nothing, which printed as "no rule claims this" — the map reporting a hole it
 * did not have, and exiting `2` over it.
 */
export function normalizePath(path) {
  return path.replaceAll("\\", "/").replace(/^\.\//u, "").replace(/\/+$/u, "");
}

/**
 * Rules that speak about one path.
 *
 * A path that names a directory claims every rule *inside* it as well as every rule above it:
 * `test:for -- docs/.vitepress/theme` has to reach the `tokens.css` rule, or naming a directory
 * would quietly return less than naming the files in it — and less is the direction that reads as
 * a pass.
 */
export function rulesFor(path) {
  const normalized = normalizePath(path);

  return RULES.filter((rule) => claims(normalized, rule.prefix));
}

/** The manual checks one path triggers, by the same rule as `rulesFor`. */
export function manualFor(path) {
  const normalized = normalizePath(path);

  return MANUAL.filter((item) => item.prefixes.some((prefix) => claims(normalized, prefix)));
}

/**
 * The documented gap that speaks about one path, if any.
 *
 * Exported so that `resolve` and `--why` ask the same question rather than each writing it out.
 * They did not: both used a bare `matchesPrefix`, which only looks downwards, so
 * `test:for .github/workflows/` — a directory, and `normalizePath` drops the trailing slash — found
 * neither a rule nor its own `NO_TESTS` entry and exited `2` over a gap the map documents. A third
 * copy of the two-directional match would have been a third place for that to happen.
 */
export function gapFor(path) {
  const normalized = normalizePath(path);

  return NO_TESTS.find((entry) => claims(normalized, entry.prefix));
}

/**
 * Whether a rule or gap written as `prefix` speaks about `path`, in both directions.
 *
 * Downwards is the obvious one: a file inside a claimed directory. Upwards is the one that keeps
 * naming a directory honest — `docs/.vitepress/theme` has to reach the `tokens.css` rule, or naming
 * a directory would quietly return less than naming the files in it, and less always reads as a
 * pass. `path` is expected to be normalised already; every caller here does that once.
 */
export function claims(path, prefix) {
  return matchesPrefix(path, prefix) || prefix.startsWith(withSlash(path));
}

/**
 * A prefix ending in `/` is a directory and matches everything under it. Anything else is one exact
 * path and matches only itself.
 *
 * The `startsWith` this used to fall back to for non-directory entries silently claimed every
 * sibling whose name began the same way: the rule for `docs/.vitepress/config.ts` also answered for
 * a `config.ts.orig`, and `docs/public/og-image.jpg` for an `og-image.jpg.bak`. Such a file
 * inherited the plan of the file it was named after and never showed up as `unmapped-source`, and a
 * stale plan is worse than no plan because it looks answered. `antidrain_site` and
 * `antidrain_extension` carry the same rule; a family of files that genuinely belongs together is
 * written out file by file, so that adding a fourth is a visible decision rather than a silent one.
 */
export function matchesPrefix(path, prefix) {
  return prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix;
}

function scriptByName(name) {
  return SCRIPTS.find((script) => script.name === name);
}

/**
 * The checks that can see the given paths, as tiers in `TIERS` order.
 *
 * `unmapped` is the honest half of the answer: a path no rule and no `NO_TESTS` entry claims. The
 * caller decides what that means — a path that still exists on disk is a hole in the map, a path
 * that no longer exists is just a deletion.
 *
 * `coveredByBuild` is the other honest half: everything the gate runs itself once `build` is in the
 * plan. None of it may appear under `skipped` — that list means "not checked by this run", and the
 * run checks these. `notRepeated` is the subset the plan also stops printing, because for those no
 * order works; see `runsInsideBuild`.
 */
export function resolve(paths) {
  const selected = new Map();
  const unmapped = [];
  const documentedGaps = [];

  for (const path of paths) {
    const rules = rulesFor(path);
    const gap = gapFor(path);

    if (rules.length === 0) {
      if (gap) documentedGaps.push({ path, why: gap.why });
      else unmapped.push(path);
      continue;
    }

    for (const rule of rules) {
      for (const name of rule.scripts) {
        const reasons = selected.get(name) ?? [];
        if (!reasons.some((reason) => reason.prefix === rule.prefix)) {
          reasons.push({ prefix: rule.prefix, why: rule.why });
        }
        selected.set(name, reasons);
      }
    }
  }

  // Whether a rule happened to select them or not: once `build` is in the plan, the gate runs
  // these, and nothing below may say otherwise.
  const coveredByBuild = selected.has("build") ? runsInsideBuild() : [];
  const notRepeated = coveredByBuild.filter(isRepeatedByBuild);

  for (const script of notRepeated) selected.delete(script.name);

  const tiers = TIERS.filter((tier) => tier.id !== "manual").map((tier) => ({
    ...tier,
    scripts: SCRIPTS.filter((script) => script.tier === tier.id && selected.has(script.name)).map(
      (script) => ({ ...script, reasons: selected.get(script.name) }),
    ),
  }));

  const manual = MANUAL.filter((item) =>
    paths.some((path) => manualFor(path).includes(item)),
  );

  // A check `build` covers is not skipped, and must not be printed under a heading that says
  // nothing checked it.
  const skipped = SCRIPTS.filter(
    (script) => !selected.has(script.name) && !coveredByBuild.includes(script),
  );

  return { tiers, manual, skipped, coveredByBuild, notRepeated, unmapped, documentedGaps };
}

/**
 * Every check `npm run build` performs, in `SCRIPTS` order.
 *
 * Two audited facts and nothing else: `build-drift` proves the build command names each `inBuild`
 * script, and `lint-chain-drift` proves the lint chain is exactly the structural tier. So naming
 * `lint` names all of it, and the closure is derived rather than restated. Every script in here is
 * a script a plan containing `build` must never call unchecked.
 */
export function runsInsideBuild(scripts = SCRIPTS) {
  const direct = scripts.filter((script) => script.inBuild);
  const throughLint = direct.some((script) => script.name === "lint")
    ? scripts.filter((script) => script.tier === "structural" && script.name !== "lint")
    : [];
  const covered = new Set([...direct, ...throughLint]);

  return scripts.filter((script) => covered.has(script));
}

/**
 * Of the checks the gate runs, the ones the plan must not print alongside it.
 *
 * The test is "does any order work", not "does build run it". `check:urls` and `check:layout` read
 * `dist/`: run before the build they answer about the previous version of the site, run after it
 * they repeat what the gate just did, so neither position is worth a line. Everything else the gate
 * covers is still worth running first — that is what a fast loop is for — and stays in the plan.
 */
function isRepeatedByBuild(script) {
  return script.inBuild && script.tier === "rendered";
}

/** What to type to run a check: its own command where the bare `npm run <name>` would not do it. */
export function invocation(script) {
  return script.command ?? `npm run ${script.name}`;
}

// --- The generated tier table in TESTING.md -------------------------------------------------

export const TABLE_START_MARKER = "<!-- test-map:start -->";
export const TABLE_END_MARKER = "<!-- test-map:end -->";

/**
 * The tier table as it must appear in `TESTING.md`.
 *
 * Generated rather than written so the document cannot drift from the map the resolver uses. Prose
 * is invisible to a gate; a generated block is not.
 */
export function renderTierTable() {
  const lines = [];

  for (const tier of TIERS) {
    lines.push(`#### ${tier.title}`, "", tier.why, "");

    if (tier.id === "manual") {
      lines.push("| Check | Run when | Costs |", "| --- | --- | --- |");
      for (const item of MANUAL) {
        lines.push(`| \`${item.id}\` | ${item.required} | ${item.costs} |`);
      }
      lines.push("");
      continue;
    }

    lines.push("| Script | What it covers | Cost |", "| --- | --- | --- |");
    for (const script of SCRIPTS.filter((entry) => entry.tier === tier.id)) {
      lines.push(`| \`${script.name}\` | ${script.covers} | ${script.cost ?? "not measured"} |`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

// --- Audit ----------------------------------------------------------------------------------

/**
 * Every way this map can be wrong, over the snapshot it was handed.
 *
 * Taking the repository as an argument rather than reading it here is what makes the audit
 * self-testable, and it is the same shape as every check in `docs/.vitepress/scripts/` and every
 * check in `../scripts/ecosystem/`.
 *
 * A `FAIL` means no result from a `test:for` run means anything, because the map it came from is
 * wrong. A `WARN` is a judgement a human has to make and a machine cannot.
 *
 * The table-drift comparison lives here and only here. It must never move into `selfTest()`:
 * `npm run test:for -- --write` runs the self-test first, without the flag, so a stale table that
 * failed the self-test would make the one command that fixes it unreachable.
 */
export function auditMap({ packageScripts, files, testingDoc }) {
  const fails = [];
  const warns = [];
  const add = (list, code, detail) => list.push(`${code}: ${detail}`);

  const named = new Set([
    ...SCRIPTS.map((script) => script.name),
    ...RULES.flatMap((rule) => rule.scripts),
  ]);

  for (const name of named) {
    if (!(name in packageScripts)) {
      add(fails, "script-missing", `the map names "${name}", which is not in package.json`);
    }
  }

  for (const script of SCRIPTS) {
    if (!TIER_IDS.has(script.tier)) {
      add(fails, "script-missing", `"${script.name}" is in tier "${script.tier}", which is not a tier`);
    }
    if (script.implements && !files.includes(script.implements)) {
      add(
        fails,
        "dead-prefix",
        `"${script.name}" claims to run ${script.implements}, which this repository does not have`,
      );
    }
  }

  for (const rule of RULES) {
    for (const name of rule.scripts) {
      if (!SCRIPT_NAMES.has(name)) {
        add(fails, "script-missing", `rule "${rule.prefix}" names "${name}", which is not in SCRIPTS`);
      }
    }
    if (rule.scripts.length === 0) {
      add(warns, "empty-rule", `rule "${rule.prefix}" selects nothing`);
    }
    if (!files.some((file) => matchesPrefix(file, rule.prefix))) {
      add(fails, "dead-prefix", `rule "${rule.prefix}" matches no path this repository owns`);
    }
    for (const counterpart of missingLocaleCounterpart(rule, RULES)) {
      add(warns, "unlocalised-rule", counterpart);
    }
  }

  for (const stale of findStaleDistRules(RULES, SCRIPTS)) {
    add(fails, "build-order", stale);
  }

  // The first of the two places the map restates a list that lives in package.json. Checked rather
  // than trusted: drop check:anchors out of the lint chain and forget this file, and the map goes on
  // promising an anchor check that the fast loop no longer performs.
  for (const drift of findLintChainDrift(SCRIPTS, packageScripts.lint ?? "")) {
    add(fails, "lint-chain-drift", drift);
  }

  // The second. `AGENTS.md` requires every check to run its own --self-test immediately before the
  // real check, inside the same npm script name. A check that lost its self-test still passes, which
  // is precisely the failure the invariant exists for.
  for (const script of SCRIPTS) {
    if (!script.selfTests) continue;
    for (const drift of findSelfTestDrift(script, packageScripts[script.name] ?? "")) {
      add(fails, "self-test-drift", drift);
    }
  }

  // And the reverse, or the column is self-certifying: drop `selfTests: true` from an entry and the
  // invariant stops being audited for that check without anything going red. A script that runs a
  // --self-test the map does not know about is one or the other of those, and both need a person.
  for (const script of SCRIPTS) {
    if (script.selfTests || !script.implements) continue;
    if ((packageScripts[script.name] ?? "").includes("--self-test")) {
      add(
        fails,
        "self-test-drift",
        `"${script.name}" runs a --self-test that the map does not know about: either mark it ` +
          `selfTests, or say why this check is exempt from the invariant`,
      );
    }
  }

  // The third, and the one the other two do not cover: `build` chains sub-checks of its own, and
  // the map both recommends them and suppresses them when it recommends the gate. Drop check:urls
  // out of the build command and forget this file, and the plan for a change to config.ts says
  // `npm run build` and quietly drops the URL check on the grounds that build performs it.
  const buildCommand = packageScripts.build ?? "";

  for (const script of SCRIPTS) {
    if (!script.inBuild) continue;
    if (!namesScript(buildCommand, script.name)) {
      add(
        fails,
        "build-drift",
        `"${script.name}" is marked inBuild, but the build command does not run it — ` +
          `the plan would report it as covered by a gate that no longer performs it`,
      );
    }
  }

  for (const overlap of findContradictedGaps(RULES, NO_TESTS)) {
    add(fails, "contradicted-gap", overlap);
  }

  for (const entry of NO_TESTS) {
    if (!files.some((file) => matchesPrefix(file, entry.prefix))) {
      add(fails, "dead-prefix", `NO_TESTS "${entry.prefix}" matches no path this repository owns`);
    }
    const gained = files.find((file) => matchesPrefix(file, entry.prefix) && isCodeOrPage(file));
    if (gained) {
      add(
        fails,
        "stale-no-tests",
        `NO_TESTS "${entry.prefix}" now contains ${gained}, which is code or a page rather than prose`,
      );
    }
  }

  for (const item of MANUAL) {
    for (const prefix of item.prefixes) {
      if (!files.some((file) => matchesPrefix(file, prefix))) {
        add(fails, "dead-prefix", `manual check "${item.id}" names "${prefix}", which matches no path this repository owns`);
      }
    }
    // The TESTING.md side is already covered: the table is generated, so a document that dropped a
    // manual row fails as `table-drift`. What can still drift silently is the other end — the
    // document the item sends you to.
    const target = item.run.match(/^[\w./-]+\.md/u)?.[0];

    if (target && !files.includes(target)) {
      add(fails, "manual-drift", `manual check "${item.id}" points at ${target}, which does not exist`);
    }
  }

  for (const file of files) {
    const covered =
      RULES.some((rule) => matchesPrefix(file, rule.prefix)) ||
      NO_TESTS.some((entry) => matchesPrefix(file, entry.prefix));
    if (!covered) {
      add(fails, "unmapped-source", `${file} is claimed by no rule and no NO_TESTS entry`);
    }
  }

  for (const file of files) {
    if (!isCheckScript(file)) continue;

    const reachable = RULES.some(
      (rule) =>
        matchesPrefix(file, rule.prefix) &&
        rule.scripts.some((name) => scriptByName(name)?.implements === file),
    );

    if (!reachable) {
      add(
        fails,
        "unreachable-check",
        `${file} is a check whose own rule names no script that actually runs it`,
      );
    }
  }

  const marked = extractMarkedTable(testingDoc);
  if (marked === null) {
    add(fails, "table-drift", `TESTING.md is missing the ${TABLE_START_MARKER} / ${TABLE_END_MARKER} pair`);
  } else if (marked.trim() !== renderTierTable().trim()) {
    add(fails, "table-drift", "the tier table in TESTING.md does not match scripts/testMap.mjs");
  }

  return { fails, warns };
}

/**
 * Where the map's idea of the fast loop and `package.json`'s disagree.
 *
 * Both directions matter. A structural script the chain no longer runs is a check the map promises
 * and the fast loop does not perform; a `check:` script in the chain that the map does not know
 * about is a check nobody can be told to run.
 *
 * Pure and exported so the self-test can hand it a broken chain directly — the real `SCRIPTS` is a
 * module constant, and a table the fixture cannot vary is a table the fixture cannot test.
 */
export function findLintChainDrift(scripts, lintCommand) {
  const drift = [];
  const steps = commandSteps(lintCommand);

  for (const script of scripts) {
    if (script.tier !== "structural" || script.name === "lint") continue;

    // By npm name or by the path of the script it runs. The chain uses both forms: `npm run
    // check:parity` for the checks that are one command, and a bare `node scripts/testFor.mjs` for
    // the map audit, because `npm run` costs more in process startup than the audit costs to run and
    // the fast loop is budgeted under a second.
    //
    // The second form needs the same care the npm form gets for free: the flags. `test:for` prints
    // a plan without `--audit` and audits nothing, so a chain that runs the file is not yet a chain
    // that runs the check. What the flags have to be is not restated here — it is whatever
    // `invocation()` already tells a person to type.
    const required = script.command?.split(" -- ")[1]?.trim() ?? "";
    const byPath =
      script.implements &&
      steps.some(
        (step) =>
          step.includes(script.implements) &&
          !step.includes("--self-test") &&
          (required === "" || step.includes(required)),
      );

    if (lintCommand.includes(script.name) || byPath) continue;

    drift.push(
      script.implements && lintCommand.includes(script.implements)
        ? `the lint chain runs ${script.implements}, but not the way "${invocation(script)}" does` +
          `${required ? ` — without ${required} it produces output rather than a verdict` : ""}`
        : `"${script.name}" is in the structural tier, but the lint chain does not run it`,
    );
  }

  const known = new Set(scripts.map((script) => script.name));

  for (const name of lintCommand.match(/check:[\w:-]+/gu) ?? []) {
    if (!known.has(name)) {
      drift.push(`the lint chain runs "${name}", which the map does not know about`);
    }
  }

  return drift;
}

/** The `&&`-separated steps of an npm command, which is the only sequencing any of them uses. */
function commandSteps(command) {
  return command.split("&&").map((step) => step.trim());
}

/**
 * Whether a command really runs an npm script, as a step and not as a substring.
 *
 * `includes(name)` was enough until `lint` was marked: `npx eslint .` contains "lint", so swapping
 * this repository's fast loop for a different linter would have left `build-drift` green while the
 * plan went on reporting `lint` as covered by a gate that no longer ran it. Every short script name
 * has that failure mode; requiring the step to be the invocation removes it for all of them.
 */
export function namesScript(command, name) {
  return commandSteps(command).some(
    (step) => step === `npm run ${name}` || step.startsWith(`npm run ${name} `),
  );
}

/**
 * Where an npm command stops honouring the `--self-test` invariant.
 *
 * Every command of this shape is a pair — `node X --self-test && node X` — and the pair is the
 * whole point: the self-test proves the check can still fail, the real run proves the repository
 * still passes. Testing only that the command mentions `--self-test` accepts three commands that
 * check nothing: one that dropped the real run and now grades only its own fixtures, one whose real
 * run points at a different file after a rename, and one that runs the self-test *after* the check
 * it is supposed to qualify. All three are green, fast, and about nothing.
 *
 * Order is required, not adjacency. "Immediately before" is what `AGENTS.md` asks for and what
 * every command here does; a segment between them would be a judgement, and a self-test that runs
 * after its check is not.
 *
 * Pure and exported so the self-test can hand it a broken command directly.
 */
export function findSelfTestDrift(script, command) {
  const segments = commandSteps(command);
  const runsScript = (segment) =>
    script.implements ? segment.includes(script.implements) : segment.length > 0;

  const selfTestAt = segments.findIndex(
    (segment) => segment.includes("--self-test") && runsScript(segment),
  );
  const realAt = segments.findIndex(
    (segment) => !segment.includes("--self-test") && runsScript(segment),
  );

  if (selfTestAt === -1) {
    return [
      `"${script.name}" is marked as shipping a --self-test, but its package.json command does not run one`,
    ];
  }

  if (realAt === -1) {
    return [
      `"${script.name}" runs its --self-test and nothing else: no invocation of ` +
        `${script.implements ?? "the check"} without the flag, so the npm script grades its own ` +
        `fixtures and never the repository`,
    ];
  }

  if (realAt < selfTestAt) {
    return [
      `"${script.name}" runs its --self-test after the real check, not immediately before it, ` +
        `so the check has already reported by the time anything qualifies it`,
    ];
  }

  return [];
}

/**
 * Rules that would have you run a dist-reading check without building first.
 *
 * `check:urls` and `check:layout` both read `docs/.vitepress/dist/`, and neither has any idea how
 * old it is. A plan that names one of them without `build` is a plan that passes against whatever
 * was left there by the last run — green, and about the previous version of the site. That is worse
 * than no plan, because it looks like evidence.
 *
 * A failure rather than a warning: there is no judgement in it. Pure and exported so the self-test
 * can hand it a bad rule directly.
 */
export function findStaleDistRules(rules, scripts) {
  const readsDist = new Set(
    scripts.filter((script) => script.tier === "rendered" && script.name !== "build").map((script) => script.name),
  );

  return rules
    .filter(
      (rule) => rule.scripts.some((name) => readsDist.has(name)) && !rule.scripts.includes("build"),
    )
    .map(
      (rule) =>
        `rule "${rule.prefix}" names a check that reads dist/ without naming build, so the run would be about a stale one`,
    );
}

/**
 * Rules that claim one locale tree and not the other.
 *
 * RU and EN are edited as a pair here, so a map that answers differently for the two languages is
 * drift in the making. It is a warning and not a failure because a deliberately one-sided rule is
 * imaginable — a fixture or an asset that genuinely exists in one locale only — and only a human can
 * tell that apart from the edit that forgot the second language.
 */
function missingLocaleCounterpart(rule, rules) {
  const match = rule.prefix.match(/^docs\/(ru|en)(\/.*)?$/u);

  if (!match) return [];

  const [, locale, rest = ""] = match;
  const twin = `docs/${locale === "ru" ? "en" : "ru"}${rest}`;

  if (rules.some((other) => other.prefix === twin)) return [];

  return [`rule "${rule.prefix}" has no counterpart "${twin}" — both locales change together`];
}

/**
 * Gaps a rule also claims.
 *
 * `resolve` drops the documented gap the moment any rule matches, so this contradiction is
 * invisible at runtime: the path reads as "no check by design" in one table and gets a plan from
 * the other, and whichever answer you see depends on which table you happened to read.
 *
 * Pure and exported so the self-test can feed it a contradiction directly.
 */
export function findContradictedGaps(rules, gaps) {
  return gaps.flatMap((gap) =>
    rules
      .filter(
        (rule) =>
          matchesPrefix(rule.prefix, gap.prefix) || matchesPrefix(gap.prefix, rule.prefix),
      )
      .map((rule) => `NO_TESTS "${gap.prefix}" overlaps rule "${rule.prefix}"`),
  );
}

/** A check script: one of the .mjs files under the scripts directory, each with its own npm name. */
function isCheckScript(file) {
  return file.startsWith("docs/.vitepress/scripts/") && file.endsWith(".mjs");
}

const CODE_EXTENSIONS = [".mjs", ".js", ".ts", ".tsx", ".vue", ".css", ".py"];

/**
 * Code, as opposed to prose.
 *
 * Every `NO_TESTS` entry in this repository says the same thing in different words: *this is prose
 * or configuration and nothing here grades it*. A directory listed there that comes to hold a
 * stylesheet or a module has stopped being that, and somebody has to decide which check owns it —
 * which is exactly the decision the entry claimed did not need making.
 *
 * This is the docs' reading of the site's `stale-no-tests`, which asks whether the prefix gained a
 * *test file*. There are no test files here, so the question had to become a different one. A
 * locale page is deliberately not part of the answer: no `NO_TESTS` prefix can prefix-match
 * `docs/ru/` or `docs/en/`, and one that did would fail as `contradicted-gap` first.
 */
function isCodeOrPage(file) {
  return CODE_EXTENSIONS.some((extension) => file.endsWith(extension));
}

/**
 * Every file the repository owns: tracked, plus untracked-but-not-ignored.
 *
 * The second half matters. A new page is untracked until the moment it is committed, and that is
 * exactly the window in which the map is most likely to be wrong about it. Auditing only the index
 * would let a new directory arrive with no rule and no complaint.
 */
export function listRepositoryFiles() {
  const git = (args) =>
    execFileSync("git", args, { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

  return [...git(["ls-files"]), ...git(["ls-files", "--others", "--exclude-standard"])];
}

export function extractMarkedTable(document) {
  const start = document.indexOf(TABLE_START_MARKER);
  const end = document.indexOf(TABLE_END_MARKER);

  if (start === -1 || end === -1 || end <= start) return null;

  return document.slice(start + TABLE_START_MARKER.length, end);
}

// --- Self-test ------------------------------------------------------------------------------

function expectFailure(label, snapshot, expectedCode) {
  const { fails } = auditMap(snapshot);

  if (!fails.some((failure) => failure.startsWith(`${expectedCode}:`))) {
    throw new Error(
      `Self-test expected ${expectedCode} for ${label}, got: ${fails.join("; ") || "no failures"}`,
    );
  }
}

/**
 * A snapshot of a tiny repository that the real map happens to describe correctly, built from the
 * map itself so the fixture cannot drift: one file per rule prefix, one per NO_TESTS prefix, one per
 * manual prefix, and a TESTING.md carrying the generated table.
 */
function buildValidSnapshot() {
  const fileFor = (prefix) => (prefix.endsWith("/") ? `${prefix}placeholder.txt` : prefix);
  const files = [
    ...RULES.map((rule) => fileFor(rule.prefix)),
    ...SCRIPTS.map((script) => script.implements).filter((path) => path),
    ...NO_TESTS.map((entry) => fileFor(entry.prefix)),
    ...MANUAL.flatMap((item) => item.prefixes.map(fileFor)),
    ...MANUAL.map((item) => item.run.match(/^[\w./-]+\.md/u)?.[0]).filter((path) => path),
  ];

  // A package.json where the lint chain runs exactly the structural tier and every self-testing
  // script runs its self-test — i.e. a repository that already agrees with the map.
  const structural = SCRIPTS.filter(
    (script) => script.tier === "structural" && script.name !== "lint",
  ).map((script) => script.name);

  // The pair, spelled with the script's own file, because that is what the audit now requires: a
  // self-test and a real run of the same thing, in that order.
  const packageScripts = Object.fromEntries(
    SCRIPTS.map((script) => {
      const file = script.implements ?? "placeholder.mjs";

      return [
        script.name,
        script.name === "lint"
          ? structural.map((name) => `npm run ${name}`).join(" && ")
          : `node ${file} --self-test && node ${file}`,
      ];
    }),
  );

  // Derived from the marks rather than restated, so the fixture cannot be the reason build-drift
  // passes. `build` also owes its own pair, for html-stubs.mjs.
  const buildScript = SCRIPTS.find((script) => script.name === "build");
  packageScripts.build = [
    ...SCRIPTS.filter((script) => script.inBuild).map((script) => `npm run ${script.name}`),
    `node ${buildScript.implements} --self-test`,
    `node ${buildScript.implements}`,
  ].join(" && ");

  return {
    packageScripts,
    files,
    testingDoc: [TABLE_START_MARKER, renderTierTable(), TABLE_END_MARKER].join("\n"),
  };
}

export function selfTest() {
  // The forms a human and a shell actually produce. Each of these named a real path and used to
  // resolve to nothing, which printed as a hole in the map and exited 2 over it.
  const canonical = rulesFor("docs/ru/").map((rule) => rule.prefix).join(",");

  for (const typed of ["docs/ru", "./docs/ru/", "./docs/ru", "docs\\ru\\", "docs/ru//"]) {
    if (rulesFor(typed).map((rule) => rule.prefix).join(",") !== canonical) {
      throw new Error(`Self-test: "${typed}" must resolve exactly as "docs/ru/" does.`);
    }
  }

  // Naming a directory has to reach the rules *inside* it, or naming a directory returns less than
  // naming its files — and less always reads as a pass.
  if (!rulesFor("docs/.vitepress/theme").some((rule) => rule.prefix.endsWith("tokens.css"))) {
    throw new Error("Self-test: a directory must claim the rules beneath it, not only those above.");
  }

  // An exact-path rule claims that path and no neighbour that happens to start with it.
  if (matchesPrefix("docs/.vitepress/config.ts.orig", "docs/.vitepress/config.ts")) {
    throw new Error("Self-test: an exact-path rule must not claim a file merely named after it.");
  }

  if (!matchesPrefix("docs/ru/faq.md", "docs/ru/") || !matchesPrefix("package.json", "package.json")) {
    throw new Error("Self-test: a directory prefix and an exact path must both still match.");
  }

  // A documented gap answers for the directory that names it as well as for the files inside it.
  // `.github/workflows/` typed with its trailing slash normalises to `.github/workflows`, which
  // matches the entry in neither direction unless the lookup asks both.
  for (const typed of [".github/workflows/", ".github/workflows", "./.github/workflows/"]) {
    if (gapFor(typed)?.prefix !== ".github/workflows/") {
      throw new Error(`Self-test: "${typed}" must find the documented gap that claims it.`);
    }
  }

  if (gapFor(".github/workflows/deploy.yml")?.prefix !== ".github/workflows/") {
    throw new Error("Self-test: a file inside a documented gap must find that gap.");
  }

  if (gapFor("docs/ru/faq.md")) {
    throw new Error("Self-test: a path a rule claims must not also read as a documented gap.");
  }

  // The plan prints what to type, and for `test:for` that is not `npm run test:for` — that prints
  // another plan. The name it prints stays the script's own.
  if (invocation(scriptByName("test:for")) !== "npm run test:for -- --audit") {
    throw new Error("Self-test: test:for must print the invocation that audits the map.");
  }

  if (invocation(scriptByName("check:parity")) !== "npm run check:parity") {
    throw new Error("Self-test: a script without its own command must print `npm run <name>`.");
  }

  for (const script of SCRIPTS) {
    if (script.command && !script.command.startsWith(`npm run ${script.name}`)) {
      throw new Error(
        `Self-test: "${script.name}" prints an invocation that names a different script.`,
      );
    }
  }

  // What reads dist/ is not printed next to `build`: before it the check reads the previous
  // build's dist/, after it the gate has already run it.
  const indexPlan = resolve(["docs/index.md"]);
  const rendered = indexPlan.tiers.find((tier) => tier.id === "rendered").scripts.map((s) => s.name);

  if (!rendered.includes("build") || rendered.includes("check:layout")) {
    throw new Error(`Self-test: a plan naming build must not also name check:layout, got ${rendered}`);
  }

  if (!indexPlan.notRepeated.some((script) => script.name === "check:layout")) {
    throw new Error("Self-test: a check dropped from the plan must be reported as covered by build.");
  }

  // The dangerous half, and the one a plan built around `docs/index.md` alone cannot see: whether a
  // check is reported as unchecked depends on the gate, never on whether some rule also selected it
  // independently. `docs/public/antidrain-mark.png` selects og-image and build, and nothing else.
  for (const paths of [["docs/index.md"], ["docs/public/antidrain-mark.png"], ["package.json"]]) {
    const plan = resolve(paths);
    const covered = runsInsideBuild().map((script) => script.name);
    const wrong = plan.skipped.filter((script) => covered.includes(script.name));

    if (wrong.length > 0) {
      throw new Error(
        `Self-test: ${paths} reports ${wrong.map((s) => s.name)} as unchecked, and the build runs them.`,
      );
    }

    if (plan.coveredByBuild.length !== covered.length) {
      throw new Error(`Self-test: ${paths} names build but does not report everything it covers.`);
    }
  }

  // And the cheap loop survives the gate being in the plan: lint reads no dist/, so there is an
  // order that works and the plan keeps naming it.
  const packagePlan = resolve(["package.json"]);
  const structural = packagePlan.tiers
    .find((tier) => tier.id === "structural")
    .scripts.map((script) => script.name);

  if (!structural.includes("lint")) {
    throw new Error("Self-test: a check the build runs but no order spoils must stay in the plan.");
  }

  if (resolve(["docs/.vitepress/scripts/check-contrast.mjs"]).coveredByBuild.length > 0) {
    throw new Error("Self-test: a plan that does not name build must report nothing as covered.");
  }

  // A short script name is a substring of half the CLI tools in existence.
  if (namesScript("npx eslint . && vitepress build docs", "lint")) {
    throw new Error("Self-test: a command that merely contains a script's name does not run it.");
  }

  if (!namesScript("npm run lint && vitepress build docs", "lint")) {
    throw new Error("Self-test: a command that runs a script as a step must be seen to run it.");
  }

  if (!namesScript("npm run check:layout", "check:layout")) {
    throw new Error("Self-test: the last step of a command runs too.");
  }

  // The fast loop runs the map audit by path rather than by npm name, and there the flags are the
  // check: without `--audit` that step prints a plan, exits 0, and grades nothing. Built from the
  // chain the map itself considers correct, so the only difference under test is the missing flag.
  const chain = SCRIPTS.filter((script) => script.tier === "structural" && script.name !== "lint")
    .map((script) => (script.implements === "scripts/testFor.mjs" ? null : `npm run ${script.name}`))
    .filter((step) => step)
    .concat("node scripts/testFor.mjs --self-test", "node scripts/testFor.mjs --audit")
    .join(" && ");

  if (findLintChainDrift(SCRIPTS, chain).length > 0) {
    throw new Error(`Self-test: the chain the map calls correct must not drift: ${findLintChainDrift(SCRIPTS, chain)}`);
  }

  const auditless = findLintChainDrift(SCRIPTS, chain.replace(" --audit", ""));

  if (auditless.length !== 1 || !auditless[0].includes("--audit")) {
    throw new Error(
      `Self-test: a lint chain running test:for without --audit must drift, and say why: ${auditless}`,
    );
  }

  if (manualFor("docs/public/screenshots").length !== manualFor("docs/public/screenshots/").length) {
    throw new Error("Self-test: a missing trailing slash must not drop a manual check.");
  }

  const contradiction = findContradictedGaps(
    [{ prefix: "docs/ru/", scripts: [], why: "" }],
    [{ prefix: "docs/ru/faq.md", why: "" }],
  );

  if (contradiction.length === 0) {
    throw new Error("Self-test expected a documented gap under a claimed directory to contradict.");
  }

  if (
    findContradictedGaps([{ prefix: "docs/ru/", scripts: [], why: "" }], [{ prefix: ".nvmrc", why: "" }])
      .length > 0
  ) {
    throw new Error("Self-test: unrelated prefixes must not read as a contradiction.");
  }

  if (
    findLintChainDrift([{ name: "check:x", tier: "structural" }], "npm run check:x").length > 0
  ) {
    throw new Error("Self-test: a structural script the lint chain runs must not read as drift.");
  }

  if (findLintChainDrift([{ name: "check:x", tier: "structural" }], "npm run check:y").length !== 2) {
    throw new Error(
      "Self-test: a lint chain that runs the wrong check must drift in both directions at once.",
    );
  }

  const distScripts = [
    { name: "check:layout", tier: "rendered" },
    { name: "build", tier: "rendered" },
  ];

  if (
    findStaleDistRules([{ prefix: "docs/ru/", scripts: ["check:layout"], why: "" }], distScripts)
      .length === 0
  ) {
    throw new Error("Self-test expected a dist-reading check without build to fail.");
  }

  if (
    findStaleDistRules(
      [{ prefix: "docs/ru/", scripts: ["check:layout", "build"], why: "" }],
      distScripts,
    ).length > 0
  ) {
    throw new Error("Self-test: naming build alongside the dist-reading check must be accepted.");
  }

  const valid = buildValidSnapshot();
  const { fails } = auditMap(valid);

  if (fails.length > 0) {
    throw new Error(`Self-test snapshot should audit clean, got: ${fails.join("; ")}`);
  }

  const [firstScript] = SCRIPTS;
  expectFailure(
    "a script the map names but package.json does not have",
    {
      ...valid,
      packageScripts: Object.fromEntries(
        Object.entries(valid.packageScripts).filter(([name]) => name !== firstScript.name),
      ),
    },
    "script-missing",
  );
  expectFailure(
    "a rule prefix that matches nothing on disk",
    { ...valid, files: valid.files.filter((file) => !matchesPrefix(file, RULES[0].prefix)) },
    "dead-prefix",
  );
  expectFailure(
    "a path claimed by no rule",
    { ...valid, files: [...valid.files, "unclaimed/module.ts"] },
    "unmapped-source",
  );
  expectFailure(
    "a documented gap that gained code",
    { ...valid, files: [...valid.files, ".claude/gained.mjs"] },
    "stale-no-tests",
  );
  expectFailure(
    "a check whose rule names nothing that runs it",
    {
      ...valid,
      files: [...valid.files, "docs/.vitepress/scripts/check-orphan.mjs"],
    },
    "unreachable-check",
  );
  expectFailure(
    "a structural check the lint chain stopped running",
    { ...valid, packageScripts: { ...valid.packageScripts, lint: "npm run check:parity" } },
    "lint-chain-drift",
  );
  expectFailure(
    "a check that lost its --self-test",
    {
      ...valid,
      packageScripts: {
        ...valid.packageScripts,
        "check:parity": "node docs/.vitepress/scripts/check-parity.mjs",
      },
    },
    "self-test-drift",
  );
  // The half a `.includes("--self-test")` accepted: keep the self-test, delete the run that reads
  // the repository, and the npm script grades its own fixtures for ever after.
  expectFailure(
    "a check that kept its --self-test and lost the real run",
    {
      ...valid,
      packageScripts: {
        ...valid.packageScripts,
        "check:parity": "node docs/.vitepress/scripts/check-parity.mjs --self-test",
      },
    },
    "self-test-drift",
  );
  expectFailure(
    "a check whose real run points at a file that is not the one it self-tests",
    {
      ...valid,
      packageScripts: {
        ...valid.packageScripts,
        "check:parity":
          "node docs/.vitepress/scripts/check-parity.mjs --self-test && node docs/.vitepress/scripts/check-slugs.mjs",
      },
    },
    "self-test-drift",
  );
  expectFailure(
    "a check that runs its --self-test after the check it qualifies",
    {
      ...valid,
      packageScripts: {
        ...valid.packageScripts,
        "check:parity":
          "node docs/.vitepress/scripts/check-parity.mjs && node docs/.vitepress/scripts/check-parity.mjs --self-test",
      },
    },
    "self-test-drift",
  );
  expectFailure(
    "a sub-check the build command no longer names",
    {
      ...valid,
      packageScripts: {
        ...valid.packageScripts,
        build: "npm run lint && vitepress build docs && npm run check:urls",
      },
    },
    "build-drift",
  );
  expectFailure(
    "a manual check pointing at a document that is gone",
    { ...valid, files: valid.files.filter((file) => file !== "AGENTS.md") },
    "manual-drift",
  );
  expectFailure(
    "a tier table that drifted from the map",
    { ...valid, testingDoc: valid.testingDoc.replace("| Script |", "| Command |") },
    "table-drift",
  );
  expectFailure(
    "TESTING.md without the markers",
    { ...valid, testingDoc: valid.testingDoc.replace(TABLE_START_MARKER, "") },
    "table-drift",
  );

  // A one-sided locale rule is the warning, not a failure: a human decides whether it was deliberate.
  const oneSided = missingLocaleCounterpart(
    { prefix: "docs/ru/glossary.md", scripts: [], why: "" },
    [{ prefix: "docs/ru/glossary.md", scripts: [], why: "" }],
  );

  if (oneSided.length === 0) {
    throw new Error("Self-test expected a rule for one locale alone to warn.");
  }

  if (
    missingLocaleCounterpart({ prefix: "docs/ru/", scripts: [], why: "" }, [
      { prefix: "docs/ru/", scripts: [], why: "" },
      { prefix: "docs/en/", scripts: [], why: "" },
    ]).length > 0
  ) {
    throw new Error("Self-test: a matched pair of locale rules must not warn.");
  }
}
