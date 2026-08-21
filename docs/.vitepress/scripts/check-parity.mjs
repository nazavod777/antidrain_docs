/**
 * Keeps the two language trees structurally 1:1.
 *
 * The RU and EN pages are translations of each other, not independent docs.
 * When two people edit them separately the structure drifts — one side gains a
 * table or a callout the other never gets — and readers of one language
 * silently get a worse page. This check makes that drift a build failure
 * instead of something noticed months later.
 *
 * It compares structure, never wording: heading levels, callout types and
 * order, table shapes, and required frontmatter.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DOCS = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** Structural fingerprint of a page: everything except the prose itself. */
const structure = (file) => {
  const raw = readFileSync(file, 'utf8')
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(raw)
  const body = fm ? raw.slice(fm[0].length) : raw

  const headings = []
  const callouts = []
  const tables = []
  const images = []
  let inFence = false
  let currentTable = null
  let currentCallout = null

  for (const line of body.split('\n')) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue }
    if (inFence) continue

    const h = /^(#{1,4})\s+\S/.exec(line)
    if (h) { headings.push(h[1].length); currentTable = null; currentCallout = null; continue }

    // Screenshots are structure too: one language gaining an illustration the
    // other never gets is the same class of drift as a missing table. The alt
    // text is deliberately not compared — it is prose, and it is translated.
    const img = /^!\[([^\]]*)\]\(([^)]+)\)/.exec(line)
    if (img) {
      images.push(img[2].replace(/\/(ru|en)\//, '/<lang>/'))
      if (!img[1].trim()) {
        images.push('MISSING-ALT')
      }
      continue
    }

    const c = /^:::\s*(\w+)(.*)$/.exec(line)
    if (c) {
      // Opening marker: record the type and whether a title was supplied.
      // An untitled callout falls back to the English type name ("DANGER"),
      // which is wrong on a Russian page, so a missing title is a defect in
      // its own right — not only an asymmetry.
      currentCallout = { type: c[1], titled: c[2].trim().length > 0, items: 0, paras: 0 }
      callouts.push(currentCallout)
      continue
    }
    if (/^:::\s*$/.test(line)) { currentCallout = null; continue }
    if (currentCallout) {
      // What the callout actually wraps. One side putting a checklist inside
      // the block while the other leaves it outside is a real difference in
      // emphasis, and this is what catches it.
      if (/^[-*+]\s+\S/.test(line)) currentCallout.items++
      else if (line.trim()) currentCallout.paras++
      continue
    }

    if (/^\|/.test(line)) {
      // A separator row (|---|---|) fixes the column count for the table.
      if (/^\|[\s:|-]+\|\s*$/.test(line)) {
        currentTable = { cols: line.split('|').slice(1, -1).length, rows: 0 }
        tables.push(currentTable)
      } else if (currentTable) {
        currentTable.rows++
      }
      continue
    }
    // Any non-table, non-heading line ends the current table.
    currentTable = null
  }

  return {
    hasTitle: /^title:/m.test(fm?.[1] ?? ''),
    hasDescription: /^description:/m.test(fm?.[1] ?? ''),
    headings,
    callouts,
    tables: tables.map((t) => `${t.cols}x${t.rows}`),
    images,
  }
}

const ruFiles = readdirSync(resolve(DOCS, 'ru')).filter((f) => f.endsWith('.md')).sort()
const enFiles = readdirSync(resolve(DOCS, 'en')).filter((f) => f.endsWith('.md')).sort()

const failures = []

if (ruFiles.join() !== enFiles.join()) {
  failures.push(`the two trees hold different files:\n    ru only: ${ruFiles.filter((f) => !enFiles.includes(f)).join(', ') || '—'}\n    en only: ${enFiles.filter((f) => !ruFiles.includes(f)).join(', ') || '—'}`)
}

for (const name of ruFiles.filter((f) => enFiles.includes(f))) {
  const ru = structure(resolve(DOCS, 'ru', name))
  const en = structure(resolve(DOCS, 'en', name))

  for (const [lang, s] of [['ru', ru], ['en', en]]) {
    if (!s.hasTitle) failures.push(`${lang}/${name}: frontmatter has no title`)
    if (!s.hasDescription) failures.push(`${lang}/${name}: frontmatter has no description`)
    if (s.images.includes('MISSING-ALT')) {
      failures.push(`${lang}/${name}: an image has no alt text, which AGENTS.md requires`)
    }
    s.callouts.forEach((c, i) => {
      if (!c.titled) {
        failures.push(`${lang}/${name}: callout #${i + 1} (::: ${c.type}) has no title, so it renders as the English word "${c.type.toUpperCase()}"`)
      }
    })
  }

  const cmp = (label, a, b) => {
    if (a.join('|') !== b.join('|')) {
      failures.push(`${name}: ${label} differ between languages\n    ru: ${a.join(', ') || '—'}\n    en: ${b.join(', ') || '—'}`)
    }
  }
  cmp('heading levels', ru.headings, en.headings)
  const shape = (c) => `${c.type}(${c.items} items, ${c.paras} paras)`
  cmp('callout types/order', ru.callouts.map(shape), en.callouts.map(shape))
  cmp('tables (cols x rows)', ru.tables, en.tables)
  cmp('images', ru.images, en.images)
}

if (failures.length) {
  console.error('RU/EN parity BROKEN — the two trees are translations and must match structurally:\n')
  for (const f of failures) console.error(`  ${f}\n`)
  console.error(`${failures.length} problem(s).`)
  process.exit(1)
}
console.log(`RU/EN parity holds across ${ruFiles.length} page pairs.`)
