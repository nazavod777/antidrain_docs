/**
 * Guards the anchor contract.
 *
 * fixtures/deployed-anchors.json was extracted from the GitBook `_book` output
 * that is live on docs.antidrain.me — 224 anchors across 26 pages. Every shared
 * deep link points at one of these, so the migration must reproduce them all.
 *
 * The check reads the markdown and applies the same slug rules VitePress will,
 * including explicit `{#custom-id}` overrides, so it measures what will
 * actually ship rather than what slugify does in isolation.
 *
 * Legacy quirk worth knowing: the old build ran TWO slug algorithms. Cyrillic
 * headings were rewritten by scripts/pretty-urls.js, but ASCII headings kept
 * GitBook's own slugger, which collapses " / " to a double dash. Headings that
 * hit that difference carry an explicit `{#...}` pin in the markdown.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { slugify, uniqueSlug } from '../slugify.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const DOCS = resolve(HERE, '../..')
const fixture = JSON.parse(readFileSync(resolve(HERE, 'fixtures/deployed-anchors.json'), 'utf8'))

/** `ru/index` is authored as `ru/README.md`; everything else maps directly. */
const pageToFile = (page) => {
  const [lang, name] = page.split('/')
  return resolve(DOCS, lang, name === 'index' ? 'index.md' : `${name}.md`)
}

/** Headings in document order, with any explicit `{#id}` override split out. */
const readHeadings = (file) => {
  const body = readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '')
  const headings = []
  let inFence = false
  for (const line of body.split('\n')) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue }
    if (inFence) continue
    const m = /^(#{1,4})\s+(.*?)\s*$/.exec(line)
    if (!m) continue
    const pinned = /\{#([^}]+)\}\s*$/.exec(m[2])
    headings.push({
      text: (pinned ? m[2].slice(0, pinned.index) : m[2]).trim(),
      pinned: pinned?.[1],
    })
  }
  return headings
}

const failures = []
let checked = 0

for (const [page, anchors] of Object.entries(fixture)) {
  const file = pageToFile(page)
  if (!existsSync(file)) { failures.push(`${page}: no markdown at ${file}`); continue }

  // Slugs are page-scoped and duplicates take -2/-3, so build the set in
  // document order exactly as markdown-it-anchor will.
  const used = new Set()
  const produced = []
  for (const h of readHeadings(file)) {
    const slug = h.pinned ?? uniqueSlug(slugify(h.text), used)
    if (h.pinned) used.add(h.pinned)
    produced.push({ slug, text: h.text, pinned: Boolean(h.pinned) })
  }

  // A superset check, not an equality check: pages are allowed to gain
  // headings, but an anchor that was once deployed must never stop resolving.
  const producedSlugs = new Set(produced.map((p) => p.slug))
  for (const { id } of anchors) {
    checked++
    if (!producedSlugs.has(id)) {
      failures.push(
        `${page}: #${id} no longer exists\n` +
        `    the page now produces: ${produced.map((p) => '#' + p.slug).join(', ')}\n` +
        `    fix: restore that heading, or pin it with {#${id}} on the heading that replaced it`,
      )
    }
  }
}

if (failures.length) {
  console.error('Anchor contract BROKEN — these deep links would stop resolving:\n')
  for (const f of failures) console.error(`  ${f}\n`)
  console.error(`${failures.length} problem(s) across ${checked} deployed anchors.`)
  process.exit(1)
}
console.log(`Anchor contract holds: all ${checked} deployed anchors still resolve.`)
