/**
 * Verifies the built site still serves every URL the live site serves.
 *
 * The deployed URL list is derived from the GitBook `_book` output, so this is
 * a direct before/after comparison rather than an assumption about how
 * VitePress lays out its dist. Run after `vitepress build`.
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(HERE, '../dist')

const PAGES = [
  'beginner-guide', 'quick-start', 'safety', 'donor-wallet', 'workspace-flow',
  'rescue-actions', 'simulation-funding-sending', 'asset-manager',
  'service-fees', 'affiliate', 'troubleshooting', 'faq',
]

/** Every URL the live site answers, and the file that must back it. */
const expected = [
  ['/', 'index.html'],
  ...['ru', 'en'].flatMap((lang) => [
    [`/${lang}/`, `${lang}/index.html`],
    ...PAGES.flatMap((page) => [
      [`/${lang}/${page}/`, `${lang}/${page}/index.html`],
      // Legacy flat URL, redirect stub.
      [`/${lang}/${page}.html`, `${lang}/${page}.html`],
    ]),
  ]),
]

const missing = expected.filter(([, file]) => !existsSync(join(DIST, file)))

// Anything served that the old site did not have is fine, but an orphaned
// top-level .html next to a directory of the same name would shadow it.
const shadowed = []
for (const lang of ['ru', 'en']) {
  const dir = join(DIST, lang)
  if (!existsSync(dir)) continue
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith('.html') || entry === 'index.html') continue
    const name = entry.replace(/\.html$/, '')
    if (!PAGES.includes(name)) shadowed.push(`${lang}/${entry}`)
  }
}

if (missing.length || shadowed.length) {
  if (missing.length) {
    console.error(`${missing.length} live URL(s) would 404 after this build:\n`)
    for (const [url, file] of missing) console.error(`  ${url}  (expected ${file})`)
  }
  if (shadowed.length) {
    console.error(`\nUnexpected stub file(s): ${shadowed.join(', ')}`)
  }
  process.exit(1)
}

console.log(`URL contract holds: all ${expected.length} live URLs are backed by a file.`)
