# Deploying the docs

The site is built by CI and published to GitHub Pages at
[docs.antidrain.me](https://docs.antidrain.me).

## How it works

`.github/workflows/deploy.yml` has two jobs:

1. **build** — runs on every push to `main` and on every pull request. Installs
   with `npm ci` on the Node version in `.nvmrc`, then runs `npm run build`,
   which is gated on four checks (below). Uploads `docs/.vitepress/dist` as an
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
| `npm run check:slugs` | All 224 heading anchors that the previous GitBook site deployed still resolve. Fixture: `docs/.vitepress/scripts/fixtures/deployed-anchors.json`. |
| `npm run check:parity` | The RU and EN trees stay structurally 1:1 — same heading levels, same table shapes, and callouts matching in type, order **and what they wrap**, and the same images in the same order. Also fails any callout with no title (an untitled one renders the English type name) and any image with no alt text. Compares structure only, never wording. |
| `npm run check:anchors` | Every in-content `#fragment` link resolves to a heading that exists. VitePress checks the page but not the fragment, so a wrong anchor silently drops the reader at the top of the page. |
| VitePress dead-link check | Internal links. Relative links break because pages are rewritten into directories — always link `/ru/page`, never `page.md`. |
| `npm run check:urls` | All 51 live URLs are backed by a file, including the legacy `*.html` redirect stubs. |
| `npm run check:layout` | Drives a real browser over `dist/` at six widths in both themes: no horizontal page scroll, no touch target under 44px below 960px, no axe (WCAG 2.1 AA) violations, no console errors, and `prefers-reduced-motion` actually suppressing transitions. It serves `dist` with GitHub Pages' resolution order, so URL behaviour matches production. |

`npm run tokens:check` is separate and local-only: it diffs the vendored token
block against the site. The site is not available in CI, so point `ANTIDRAIN_SITE` at
your checkout and run it by hand after touching tokens.

## Domain

`docs/public/CNAME` holds `docs.antidrain.me` and `docs/public/.nojekyll`
disables Jekyll processing. Both are copied verbatim into the build output.

## If a URL regresses

The URL and anchor contracts are the only things that can break for people
outside the repo. `check:urls` and `check:slugs` cover them, and both run before
the artifact is produced. If one fails, fix the content rather than the check —
the fixture records what is actually deployed today.
