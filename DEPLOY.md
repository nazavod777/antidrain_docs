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
| `npm run check:layout` | Drives a real browser over `dist/` at six widths in both themes: no horizontal page scroll, no touch target under 44px below 960px, no axe (WCAG 2.1 AA) violations, no console errors, and `prefers-reduced-motion` actually suppressing transitions. 81 navigations in about 100s. It serves `dist` with GitHub Pages' resolution order, so URL behaviour matches production. |

Seven of the eight are npm scripts of ours, and every one of those runs its own
`--self-test` immediately before the real check, inside the same npm script
name. A gate that quietly stopped checking anything then shows up as a red
self-test rather than a green run. The eighth, the VitePress dead-link check, is
VitePress' own. The map audit checks that pairing itself, as `self-test-drift`.

`npm run tokens:check` is separate and local-only: it diffs the vendored token
block against the site. The site is not available in CI, so point `ANTIDRAIN_SITE` at
your checkout and run it by hand after touching tokens.

## Named gaps

These are known, deliberate and unclosed. They are written down because a check
that passes says nothing about what it never looked at.

- **`check:layout` renders 10 of the 33 page URLs — 23 are never opened in a
  browser.** The ten are layout *types*: root landing, both locale indexes, the
  widest table, the pages carrying screenshots. A page whose markdown produces a
  shape none of those ten covers can therefore ship with horizontal scroll or an
  axe violation. Closing it means ten more page types, not ten more URLs.
- **A targeted `check:layout` run is not the gate.** `--page <url>` and
  `--changed <path>` narrow the set of pages — never the set of checks per page:
  the same six dark widths, two light widths and axe at 390 and 1440. The single
  thing structurally outside a targeted run is the `prefers-reduced-motion`
  pass, which is a fixed extra pass on one URL rather than a per-page check.
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
