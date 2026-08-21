/**
 * Every in-content link that points at a #fragment must resolve to a heading
 * that actually exists. VitePress's dead-link check verifies the page, not the
 * fragment, so a wrong anchor lands the reader at the top of the page with no
 * error anywhere.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { slugify, uniqueSlug } from '../slugify.ts'

const anchorsOf = (file) => {
  const body = readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '')
  const used = new Set()
  const out = new Set()
  let fence = false
  for (const line of body.split('\n')) {
    if (/^\s*```/.test(line)) { fence = !fence; continue }
    if (fence) continue
    const m = /^(#{1,4})\s+(.*?)\s*$/.exec(line)
    if (!m) continue
    const pinned = /\{#([^}]+)\}\s*$/.exec(m[2])
    out.add(pinned ? pinned[1] : uniqueSlug(slugify(m[2].trim()), used))
    if (pinned) used.add(pinned[1])
  }
  return out
}

const DOCS = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const cache = new Map()
const anchors = (lang, page) => {
  const key = `${lang}/${page}`
  if (!cache.has(key)) {
    const file = resolve(DOCS, lang, `${page || 'index'}.md`)
    cache.set(key, existsSync(file) ? anchorsOf(file) : null)
  }
  return cache.get(key)
}

let checked = 0
const broken = []
for (const lang of ['ru', 'en']) {
  for (const name of readdirSync(resolve(DOCS, lang)).filter((f) => f.endsWith('.md'))) {
    const file = resolve(DOCS, lang, name)
    const body = readFileSync(file, 'utf8')
    const self = name.replace('.md', '')
    for (const m of body.matchAll(/\]\((?:\/(ru|en)\/([a-z-]*))?#([^)]+)\)/g)) {
      checked++
      const targetLang = m[1] ?? lang
      const targetPage = m[1] ? (m[2] || 'index') : self
      const set = anchors(targetLang, targetPage === 'index' ? '' : targetPage)
      const where = `${lang}/${name}`
      if (!set) {
        broken.push(`${where}: page ${targetLang}/${targetPage} does not exist`)
        continue
      }
      if (!set.has(m[3])) {
        broken.push(`${where}: #${m[3]} is not a heading in ${targetLang}/${targetPage}`)
      }
    }
  }
}
if (broken.length) {
  console.error(`Anchor links BROKEN — these land the reader at the top of the page:\n`)
  for (const b of broken) console.error(`  ${b}`)
  console.error(`\n${broken.length} of ${checked} anchor links do not resolve.`)
  process.exit(1)
}
console.log(`Anchor links hold: all ${checked} in-content #fragments resolve to a real heading.`)
