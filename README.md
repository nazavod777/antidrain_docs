# AntiDrain Docs

Source for [docs.antidrain.me](https://docs.antidrain.me) — documentation for
the [AntiDrain](https://antidrain.me) EVM wallet rescue workspace, in Russian
and English.

Built with [VitePress](https://vitepress.dev). The design system is shared with
the product site; see [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

## Quick start

```bash
nvm use          # Node 22, per .nvmrc
npm ci
npm run dev      # http://localhost:5173 (or the next free port)
```

## Layout

```
docs/
  index.md              language-picker landing
  ru/*.md  en/*.md      13 pages each, kept 1:1
  .vitepress/
    config.ts           navigation, locales, SEO, URL rewrites
    slugify.ts          the one heading-slug implementation
    theme/              tokens, light theme, VitePress bridge, prose styles
    scripts/            build-time checks and the postbuild redirect stubs
```

## Editing content

- Every page needs `title` and `description` frontmatter — they feed the page
  title, meta tags and the search index.
- Link internally with absolute locale paths: `/ru/quick-start`, never
  `quick-start.md`. Pages are rewritten into directories, so relative links
  break; the build fails on them.
- **Do not change existing heading text.** Heading text is the URL anchor, and
  `npm run check:slugs` asserts that all 224 anchors the site has already
  deployed still resolve. Adding headings is fine. If a heading must be
  reworded, pin the old anchor: `## New text {#old-anchor}`.
- RU and EN are maintained as a pair.

## Checks

```bash
npm run lint     # contrast (both themes) + anchor contract + RU/EN parity
npm run build    # the above, plus dead links, redirect stubs, URL contract
npm run tokens:check  # local only: diff tokens.css against antidrain_site2
```

See [DEPLOY.md](DEPLOY.md) for what each check protects and how deployment
works, and [AGENTS.md](AGENTS.md) for the repository's invariants and the
cross-platform, accessibility and UX requirements.
