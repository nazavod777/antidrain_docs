# Docs Site

This folder is now a standalone VitePress docs app.

## Local workflow

Install dependencies once.

From the repository root:

```bash
npm install --prefix docs-site
```

Or from inside `docs-site/`:

```bash
npm install
```

Run the local docs dev server:

```bash
npm run docs:serve
```

Build the production output:

```bash
npm run docs:build
```

Preview the production build:

```bash
npm run docs:preview
```

By default the preview server runs on `http://127.0.0.1:4175`.

## Manual publishing flow

For the separate GitHub Pages repo on `docs.antidrain.me`:

1. Keep editing the source here in the main project.
2. Run `npm run docs:build`.
3. Upload the contents of `docs-site/.vitepress/dist/` into the dedicated docs repository.
4. GitHub Pages serves that built output on `docs.antidrain.me`.

## Why this setup

- better visual baseline than the old docsify shell
- built-in local search, nav, locale switching, and docs layout
- still keeps docs separate from the main app build
- still works with your manual GitHub Pages publishing flow
