/**
 * Leaves redirect stubs at the legacy `*.html` paths.
 *
 * The GitBook build served `/ru/quick-start/` and left a meta-refresh stub at
 * `/ru/quick-start.html` for anyone holding the older flat URL. VitePress emits
 * the directory form directly, so this restores the stubs — 20 lines in place
 * of the 300-line scripts/pretty-urls.js that used to do the whole rewrite.
 */
import { readdirSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')

if (!existsSync(DIST)) {
  console.error(`No build output at ${DIST}. Run vitepress build first.`)
  process.exit(1)
}

const stub = (target) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${target}">
<title>Redirecting</title>
</head>
<body><p>Redirecting to <a href="${target}">${target}</a>.</p>
<script>location.replace(${JSON.stringify(target)})</script>
</body>
</html>
`

let written = 0
for (const lang of ['ru', 'en']) {
  const langDir = join(DIST, lang)
  if (!existsSync(langDir)) continue
  for (const entry of readdirSync(langDir)) {
    const dir = join(langDir, entry)
    // Only page directories — each holds the index.html VitePress emitted.
    if (!statSync(dir).isDirectory()) continue
    if (!existsSync(join(dir, 'index.html'))) continue
    const target = `/${lang}/${entry}/`
    writeFileSync(join(langDir, `${entry}.html`), stub(target))
    written++
  }
}

console.log(`html-stubs: wrote ${written} legacy redirect stub(s) into ${relative(process.cwd(), DIST)}`)
