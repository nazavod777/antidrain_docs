/**
 * Every in-content link that points at a #fragment must resolve to a heading
 * that actually exists. VitePress's dead-link check verifies the page, not the
 * fragment, so a wrong anchor lands the reader at the top of the page with no
 * error anywhere.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { slugify, uniqueSlug } from '../slugify.ts'

const SELF_TEST_FLAG = '--self-test'

const DOCS = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** The anchors a page publishes, applying the same slug rules VitePress will. */
export const anchorsOf = (markdown) => {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '')
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

/**
 * The whole check, as a pure function of injected content.
 *
 * `pages` maps `<lang>/<name>` — with the locale index spelled `index` — to the
 * page source. Returns how many fragments were proved; throws naming each one
 * that does not resolve.
 */
export const assertAnchorLinks = (pages) => {
  const cache = new Map()
  const anchors = (key) => {
    if (!cache.has(key)) cache.set(key, key in pages ? anchorsOf(pages[key]) : null)
    return cache.get(key)
  }

  let checked = 0
  const broken = []
  for (const [where, body] of Object.entries(pages)) {
    const [lang, self] = where.split('/')
    for (const m of body.matchAll(/\]\((?:\/(ru|en)\/([a-z-]*))?#([^)]+)\)/g)) {
      checked++
      const targetLang = m[1] ?? lang
      const targetPage = m[1] ? (m[2] || 'index') : self
      const set = anchors(`${targetLang}/${targetPage}`)
      if (!set) {
        broken.push(`${where}.md: page ${targetLang}/${targetPage} does not exist`)
        continue
      }
      if (!set.has(m[3])) {
        broken.push(`${where}.md: #${m[3]} is not a heading in ${targetLang}/${targetPage}`)
      }
    }
  }

  if (broken.length) {
    throw new Error(
      ['Anchor links BROKEN — these land the reader at the top of the page:', '']
        .concat(broken.map((b) => `  ${b}`))
        .concat('', `${broken.length} of ${checked} anchor links do not resolve.`)
        .join('\n'),
    )
  }

  return checked
}

function expectFailure(handler, expectedFragment, description) {
  try {
    handler()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.includes(expectedFragment)) {
      throw new Error(
        `Anchor link self-test failed: ${description} reported ${JSON.stringify(message)}`,
      )
    }

    return
  }

  throw new Error(`Anchor link self-test failed: ${description} was accepted`)
}

function runSelfTest() {
  const published = anchorsOf('---\ntitle: t\n---\n# Кнопка недоступна\n\n```\n# fenced\n```\n\n## Pinned {#kept}\n')
  if (!published.has('knopka-nedostupna') || !published.has('kept') || published.size !== 2) {
    throw new Error(`Anchor link self-test failed: anchorsOf produced ${[...published].join(',')}`)
  }

  const pages = {
    'ru/index': '# Дом\n\nСм. [подготовку](/ru/prepare#shag-odin) и [дом](#dom).\n',
    'ru/prepare': '# Подготовка\n\n## Шаг один\n',
    'en/index': '# Home\n',
  }

  if (assertAnchorLinks(pages) !== 2) {
    throw new Error('Anchor link self-test failed: expected two fragments to be checked')
  }

  expectFailure(
    () => assertAnchorLinks({ ...pages, 'ru/prepare': '# Подготовка\n\n## Шаг два\n' }),
    'ru/index.md: #shag-odin is not a heading in ru/prepare',
    'a cross-page fragment whose heading was reworded',
  )

  expectFailure(
    () => assertAnchorLinks({ ...pages, 'ru/index': `${pages['ru/index']}\n[нет](#net-takogo)\n` }),
    'ru/index.md: #net-takogo is not a heading in ru/index',
    'a same-page fragment that never existed',
  )

  expectFailure(
    () => assertAnchorLinks({ 'ru/index': '[туда](/ru/gone#anywhere)\n' }),
    'ru/index.md: page ru/gone does not exist',
    'a fragment on a page that is not there',
  )

  console.log('Anchor link self-test passed')
}

const readPages = () =>
  Object.fromEntries(
    ['ru', 'en'].flatMap((lang) =>
      readdirSync(resolve(DOCS, lang))
        .filter((f) => f.endsWith('.md'))
        .map((f) => [`${lang}/${f.replace(/\.md$/, '')}`, readFileSync(resolve(DOCS, lang, f), 'utf8')]),
    ),
  )

function main() {
  if (process.argv.includes(SELF_TEST_FLAG)) {
    runSelfTest()
    return
  }

  const checked = assertAnchorLinks(readPages())
  console.log(`Anchor links hold: all ${checked} in-content #fragments resolve to a real heading.`)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
