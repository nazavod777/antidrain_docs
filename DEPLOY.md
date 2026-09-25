# Deploying the docs

The site is built by CI and published to GitHub Pages at
[docs.antidrain.me](https://docs.antidrain.me).

## How it works

`.github/workflows/deploy.yml` has two jobs:

1. **build** — runs on every push to `main` and on every pull request. Installs
   with `npm ci` on the Node version in `.nvmrc`, then runs `npm run build`,
   which is gated on eight checks (below). Uploads `docs/.vitepress/dist` as an
   artifact.
2. **deploy** — runs only for `main`, downloads that artifact and publishes it.

Pull requests therefore get a verified build without deploying. Nothing needs to
be built by hand, and there is no `gh-pages` branch in the flow any more.

## Local development

```bash
nvm use                 # Node 22, per .nvmrc
npm ci
npm run dev        # http://localhost:5173 (or the next free port)
```

To check the real output rather than the dev server:

```bash
npm run build
npm run preview
```

Note that `vitepress preview` resolves extensionless paths differently from
GitHub Pages. To test URL behaviour the way production sees it, serve `dist`
with a server that tries `<path>`, then `<path>.html`, then `<path>/index.html`.
`check:layout` already does exactly that, so running the build is the quickest
way to exercise production URL semantics.

`check:layout` needs a Chromium, and finds one in this order: an explicit
`PLAYWRIGHT_CHROMIUM_PATH`, then Playwright's own download, then a system
Chromium (`/usr/bin/chromium-browser` and friends). So on a machine that
already has Chrome or Chromium, nothing extra is required.

Playwright's postinstall otherwise fetches Chromium, Firefox **and** WebKit —
about a gigabyte for the one browser we use. CI sets
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` on `npm ci` and then installs only
Chromium. Locally you can do the same:

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci
```

## The checks

`npm run build` fails rather than shipping if any of these break:

| Check | What it protects |
| --- | --- |
| `npm run check:contrast` | Every text/surface pair in **both** themes against WCAG (4.5:1 body, 3:1 focus rings), and that no focus ring is built from a translucent colour. Reads the real values out of `tokens.css` and `light.css`. |
| `npm run check:slugs` | All 224 heading anchors the previous GitBook site deployed, plus the 98 recorded for the pages written since, still resolve. Fixtures: `deployed-anchors.json` and `post-migration-anchors.json`, both under `docs/.vitepress/scripts/fixtures/`. A page that appears in `pages.ts` and in neither fixture fails the check until it is declared in `POST_MIGRATION_PAGES` with a reason and recorded with `npm run check:slugs -- --record`. |
| `npm run check:parity` | The RU and EN trees stay structurally 1:1 — same heading levels, same table shapes, and callouts matching in type, order **and what they wrap**, and the same images in the same order. Also fails any callout with no title (an untitled one renders the English type name) and any image with no alt text. Compares structure only, never wording. |
| `npm run check:anchors` | Every in-content `#fragment` link resolves to a heading that exists. VitePress checks the page but not the fragment, so a wrong anchor silently drops the reader at the top of the page. |
| `npm run test:for -- --audit` | That the test map still describes this repository: every path claimed by a rule or by a documented gap, every check reachable from its own source, the `lint` chain, the `--self-test` pairing and the build's own sub-checks matching `package.json`, and the tier table in `TESTING.md` matching `scripts/testMap.mjs`. `TESTING.md` § When the map is wrong lists all twelve failures. |
| VitePress dead-link check | Internal links. Relative links break because pages are rewritten into directories — always link `/ru/page`, never `page.md`. |
| `npm run check:urls` | All 63 live URLs are backed by a file, including the legacy `*.html` redirect stubs. The page list comes from `docs/.vitepress/pages.ts`, so it cannot fall behind the sidebar. |
| `npm run check:layout` | Drives a real browser over every page URL in `dist/`: no horizontal page scroll, no touch target under 44px below 960px, no axe (WCAG 2.1 AA) violations, no console errors, `prefers-reduced-motion` actually suppressing transitions, and no label lost to forced-colors mode. The ten layout types get six widths in dark and the two extremes (390, 1440) in light; every other URL is swept at 390, 1024 and 1440 in dark and 390 and 1440 in light; axe runs at 390 and 1440 in both themes on every page — the matrix is under "Named gaps". Each navigation is its own browser context, eight at a time by default (`--concurrency <n>`, `1` for a sequential run), and findings print in page, theme, width order whatever finished first. Before measuring, it proves its own teardown: a child process runs real navigations, one of them throws, and the child must exit non-zero by itself within 30 s, or the gate fails rather than risk hanging CI. It serves `dist` with GitHub Pages' resolution order, so URL behaviour matches production. |

Seven of the eight are npm scripts of ours, and every one of those runs its own
`--self-test` immediately before the real check, inside the same npm script
name. A gate that quietly stopped checking anything then shows up as a red
self-test rather than a green run. The eighth, the VitePress dead-link check, is
VitePress' own. The map audit checks that pairing itself, as `self-test-drift`.

`npm run tokens:check` is separate and local-only: it diffs the vendored token
block against the site. The site is not available in CI, so it reads the sibling `../antidrain_site`
checkout, or `ANTIDRAIN_SITE` if set, and is run by hand after touching tokens.

## Named gaps

These are known, deliberate and unclosed. They are written down because a check
that passes says nothing about what it never looked at.

- **`check:layout` opens every page URL, but not every page at every width.**
  The page list is `pages.ts`, so a new page is rendered without being listed
  anywhere else. Two depths:

  | Pages | Dark | Light | axe |
  | --- | --- | --- | --- |
  | The ten layout types — root landing, both locale indexes, the widest table, the pages carrying screenshots | 390, 480, 768, 1024, 1280, 1440 | 390, 1440 | 390 and 1440, both themes |
  | Every other URL, swept | 390, 1024, 1440 | 390, 1440 | 390 and 1440, both themes |

  A swept page is never rendered at 480, 768 or 1280 in dark. Those widths
  exercise chrome every page shares, which the ten types already render; what a
  swept page adds is its own content, and content overflows first at 390 and in
  the narrow column at 1024. A page whose markdown only breaks at 480, 768 or
  1280 therefore ships unnoticed unless it is one of the ten or a targeted run
  names it. The run prints this line on every gate run.
- **A targeted `check:layout` run is not the gate.** `--page <url>` and
  `--changed <path>` narrow the set of pages — never the set of checks per page:
  every named page gets the full depth, six dark widths, two light widths and
  axe at 390 and 1440, even one the gate only sweeps. Two things are
  structurally outside a targeted run, and the run prints a line for each: the
  `prefers-reduced-motion` pass and the forced-colors pass. Both are fixed
  extra passes on one URL rather than per-page checks.
  Both themes *are* covered, because the theme loop runs inside the page loop. A
  `--changed` path that is not page markdown escalates the run back to the full
  gate, since a token or a script is not localised to one URL. Every run prints
  what it did not do; `npm run build` is still what "done" means.

## Domain

`docs/public/CNAME` holds `docs.antidrain.me` and `docs/public/.nojekyll`
disables Jekyll processing. Both are copied verbatim into the build output.

## If a URL regresses

The URL and anchor contracts are the only things that can break for people
outside the repo. `check:urls` and `check:slugs` cover them, and both run before
the artifact is produced. If one fails, fix the content rather than the check —
the fixture records what is actually deployed today.
