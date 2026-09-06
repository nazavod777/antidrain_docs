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
 *
 * TWO FIXTURES, AND WHY. The GitBook fixture can only ever cover pages that
 * existed on GitBook. Three pages were written afterwards, and for months they
 * had no anchor contract at all: their headings could be reworded freely and
 * every deep link into them would break in silence. So they are declared in
 * POST_MIGRATION_PAGES below, their anchors are recorded in
 * fixtures/post-migration-anchors.json, and both fixtures are enforced the same
 * way. POST_MIGRATION_PAGES is cross-checked against ../pages.ts in both
 * directions, which is what closes the real gap: a FOURTH such page cannot be
 * added silently — this check fails until someone declares it and records it.
 *
 * `npm run check:slugs -- --record` rewrites the post-migration fixture from
 * the current markdown. That is a deliberate act, never part of the gate.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { slugify, uniqueSlug } from '../slugify.ts'
import { LOCALES, PAGE_SLUGS, sourceFile } from '../pages.ts'

const SELF_TEST_FLAG = '--self-test'
const RECORD_FLAG = '--record'

const HERE = dirname(fileURLToPath(import.meta.url))
const DOCS = resolve(HERE, '../..')
const LEGACY_FIXTURE = resolve(HERE, 'fixtures/deployed-anchors.json')
const POST_MIGRATION_FIXTURE = resolve(HERE, 'fixtures/post-migration-anchors.json')

/**
 * Pages with no GitBook past, and therefore nothing in the legacy fixture.
 *
 * Each entry needs a reason, because the list is an exemption from the URL
 * contract everyone else is held to, and an exemption without a reason is
 * indistinguishable from an oversight. Adding a page to pages.ts without adding
 * it here — or here without adding it there — fails this check.
 */
const POST_MIGRATION_PAGES = [
  {
    page: 'wallet-compromised',
    why: 'written after the GitBook migration; explains how the compromise happened, a topic the old site had no page for',
  },
  {
    page: 'prepare',
    why: 'written after the GitBook migration; split out of quick-start so the setup steps have their own URL',
  },
  {
    page: 'glossary',
    why: 'written after the GitBook migration; the old site defined terms inline instead',
  },
]

/** Fixture keys are `<lang>/<page>`, with the locale index spelled `index`. */
const fixtureKey = (lang, slug) => `${lang}/${slug === '' ? 'index' : slug}`

/** Headings in document order, with any explicit `{#id}` override split out. */
export const readHeadings = (markdown) => {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '')
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

/**
 * The slugs a page will actually ship, in document order.
 *
 * Slugs are page-scoped and duplicates take -2/-3, so the set is built in
 * document order exactly as markdown-it-anchor will.
 */
export const producedAnchors = (headings) => {
  const used = new Set()
  return headings.map((h) => {
    const slug = h.pinned ?? uniqueSlug(slugify(h.text), used)
    if (h.pinned) used.add(h.pinned)
    return { id: slug, text: h.text }
  })
}

/**
 * The whole check, as a pure function of injected content.
 *
 * `markdownFor(key)` returns the page source, or null when there is no file.
 * Returns the counts the success line reports, and throws naming every problem.
 */
export const assertAnchorContract = ({
  locales,
  pageSlugs,
  postMigrationPages,
  legacy,
  postMigration,
  markdownFor,
}) => {
  const failures = []
  const declared = new Map(postMigrationPages.map((entry) => [entry.page, entry.why]))
  const livePages = new Set(pageSlugs)

  // 1. Every declared exemption must still be a page, and must still deserve
  //    the exemption. A page that turns out to have a GitBook past is covered
  //    by the legacy fixture and does not belong on this list.
  for (const { page, why } of postMigrationPages) {
    if (!livePages.has(page)) {
      failures.push(
        `POST_MIGRATION_PAGES lists '${page}', which is not a page in pages.ts\n` +
        `    fix: drop the entry, or restore the page`,
      )
      continue
    }
    if (!String(why ?? '').trim()) {
      failures.push(`POST_MIGRATION_PAGES entry '${page}' has no reason`)
    }
    for (const lang of locales) {
      if (legacy[fixtureKey(lang, page)]) {
        failures.push(
          `POST_MIGRATION_PAGES lists '${page}', but ${fixtureKey(lang, page)} IS in the GitBook fixture\n` +
          `    fix: drop the entry — the page has deployed anchors and is already covered`,
        )
      }
    }
  }

  // 2. Every page carries an anchor contract from one fixture or the other.
  //    This is the check that makes a fourth undeclared page impossible.
  for (const lang of locales) {
    for (const slug of pageSlugs) {
      const key = fixtureKey(lang, slug)
      if (legacy[key] || declared.has(slug)) continue
      failures.push(
        `${key} has no anchor contract at all\n` +
        `    it is not in fixtures/deployed-anchors.json, and '${slug}' is not in POST_MIGRATION_PAGES\n` +
        `    fix: if the page is new, add it to POST_MIGRATION_PAGES with a reason and run\n` +
        `         npm run check:slugs -- --record`,
      )
    }
  }

  // 3. No fixture key may outlive its page.
  const expectedPostMigration = new Set(
    locales.flatMap((lang) => postMigrationPages.map(({ page }) => fixtureKey(lang, page))),
  )
  for (const [label, fixture] of [['deployed-anchors', legacy], ['post-migration-anchors', postMigration]]) {
    for (const key of Object.keys(fixture)) {
      const [lang, name] = key.split('/')
      const slug = name === 'index' ? '' : name
      if (!locales.includes(lang) || !livePages.has(slug)) {
        failures.push(`${label}.json holds '${key}', which is not a page in pages.ts`)
      }
    }
  }
  for (const key of Object.keys(postMigration)) {
    if (!expectedPostMigration.has(key)) {
      failures.push(
        `post-migration-anchors.json holds '${key}', which is not in POST_MIGRATION_PAGES\n` +
        `    fix: npm run check:slugs -- --record`,
      )
    }
  }
  for (const key of expectedPostMigration) {
    if (!postMigration[key]) {
      failures.push(
        `${key} is declared post-migration but has no recorded anchors\n` +
        `    fix: npm run check:slugs -- --record`,
      )
    }
  }

  // 4. Both fixtures, enforced identically. A superset check, not an equality
  //    check: pages are allowed to gain headings, but an anchor that was once
  //    published must never stop resolving.
  let checked = 0
  let pages = 0
  for (const [label, fixture] of [['deployed', legacy], ['recorded', postMigration]]) {
    for (const [key, anchors] of Object.entries(fixture)) {
      const markdown = markdownFor(key)
      if (markdown === null) {
        failures.push(`${key}: no markdown for a page the ${label} fixture covers`)
        continue
      }
      pages++
      const produced = producedAnchors(readHeadings(markdown))
      const producedIds = new Set(produced.map((p) => p.id))
      for (const { id } of anchors) {
        checked++
        if (!producedIds.has(id)) {
          failures.push(
            `${key}: #${id} no longer exists\n` +
            `    the page now produces: ${produced.map((p) => '#' + p.id).join(', ')}\n` +
            `    fix: restore that heading, or pin it with {#${id}} on the heading that replaced it`,
          )
        }
      }
    }
  }

  if (failures.length) {
    throw new Error(
      ['Anchor contract BROKEN — these deep links would stop resolving:', '']
        .concat(failures.map((f) => `  ${f}\n`))
        .concat(`${failures.length} problem(s) across ${checked} anchors.`)
        .join('\n'),
    )
  }

  return {
    checked,
    pages,
    deployed: Object.values(legacy).reduce((n, a) => n + a.length, 0),
    recorded: Object.values(postMigration).reduce((n, a) => n + a.length, 0),
  }
}

const readFixture = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {})

const markdownOnDisk = (key) => {
  const [lang, name] = key.split('/')
  const file = resolve(DOCS, sourceFile(lang, name === 'index' ? '' : name))
  return existsSync(file) ? readFileSync(file, 'utf8') : null
}

function record() {
  const out = {}
  for (const lang of LOCALES) {
    for (const { page } of POST_MIGRATION_PAGES) {
      const key = fixtureKey(lang, page)
      const markdown = markdownOnDisk(key)
      if (markdown === null) {
        throw new Error(`cannot record ${key}: no markdown at ${resolve(DOCS, sourceFile(lang, page))}`)
      }
      out[key] = producedAnchors(readHeadings(markdown))
    }
  }
  writeFileSync(POST_MIGRATION_FIXTURE, `${JSON.stringify(out, null, 2)}\n`)
  const total = Object.values(out).reduce((n, a) => n + a.length, 0)
  console.log(
    `Recorded ${total} anchor(s) across ${Object.keys(out).length} post-migration page(s) into\n` +
    `  ${POST_MIGRATION_FIXTURE}\n` +
    'Read the diff: every line you did not intend is a deep link you just stopped protecting.',
  )
}

function expectFailure(handler, expectedFragment, description) {
  try {
    handler()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.includes(expectedFragment)) {
      throw new Error(
        `Anchor contract self-test failed: ${description} reported ${JSON.stringify(message)}`,
      )
    }

    return
  }

  throw new Error(`Anchor contract self-test failed: ${description} was accepted`)
}

function runSelfTest() {
  // The slug rules themselves, before anything is compared.
  const anchors = producedAnchors(
    readHeadings('---\ntitle: t\n---\n# Заголовок\n\n```\n# not a heading\n```\n\n## Same\n\n## Same\n\n## Pinned {#old-anchor}\n'),
  )
  const ids = anchors.map((a) => a.id).join(',')
  if (ids !== 'zagolovok,same,same-2,old-anchor') {
    throw new Error(`Anchor contract self-test failed: slug rules produced ${ids}`)
  }

  const base = {
    locales: ['ru'],
    pageSlugs: ['', 'old', 'new'],
    postMigrationPages: [{ page: 'new', why: 'written after the migration' }],
    legacy: { 'ru/index': [{ id: 'home' }], 'ru/old': [{ id: 'kept' }] },
    postMigration: { 'ru/new': [{ id: 'fresh' }] },
    markdownFor: (key) =>
      ({
        'ru/index': '# Home {#home}\n',
        'ru/old': '# Kept {#kept}\n',
        'ru/new': '# Fresh {#fresh}\n',
      })[key] ?? null,
  }

  const counts = assertAnchorContract(base)
  if (counts.checked !== 3 || counts.deployed !== 2 || counts.recorded !== 1) {
    throw new Error(`Anchor contract self-test failed: counted ${JSON.stringify(counts)}`)
  }

  expectFailure(
    () =>
      assertAnchorContract({ ...base, markdownFor: (key) => (key === 'ru/old' ? '# Reworded\n' : base.markdownFor(key)) }),
    'ru/old: #kept no longer exists',
    'a deployed anchor being reworded away',
  )

  expectFailure(
    () =>
      assertAnchorContract({ ...base, markdownFor: (key) => (key === 'ru/new' ? '# Reworded\n' : base.markdownFor(key)) }),
    'ru/new: #fresh no longer exists',
    'a recorded post-migration anchor being reworded away',
  )

  // The gap this stage exists to close: a fourth page with no legacy past.
  expectFailure(
    () =>
      assertAnchorContract({
        ...base,
        pageSlugs: [...base.pageSlugs, 'fourth'],
        markdownFor: (key) => (key === 'ru/fourth' ? '# Fourth\n' : base.markdownFor(key)),
      }),
    "ru/fourth has no anchor contract at all",
    'a new page nobody declared',
  )

  expectFailure(
    () =>
      assertAnchorContract({
        ...base,
        postMigrationPages: [...base.postMigrationPages, { page: 'gone', why: 'stale' }],
      }),
    "POST_MIGRATION_PAGES lists 'gone', which is not a page in pages.ts",
    'a declaration outliving its page',
  )

  expectFailure(
    () =>
      assertAnchorContract({
        ...base,
        postMigrationPages: [...base.postMigrationPages, { page: 'old', why: 'wrong' }],
      }),
    'IS in the GitBook fixture',
    'exempting a page that has deployed anchors',
  )

  expectFailure(
    () => assertAnchorContract({ ...base, postMigrationPages: [{ page: 'new', why: '  ' }] }),
    "POST_MIGRATION_PAGES entry 'new' has no reason",
    'an exemption with no reason',
  )

  expectFailure(
    () => assertAnchorContract({ ...base, postMigration: {} }),
    'ru/new is declared post-migration but has no recorded anchors',
    'a declared page nobody recorded',
  )

  expectFailure(
    () => assertAnchorContract({ ...base, postMigration: { ...base.postMigration, 'ru/old': [{ id: 'kept' }] } }),
    "post-migration-anchors.json holds 'ru/old', which is not in POST_MIGRATION_PAGES",
    'a stale recorded page',
  )

  // Guard case: the real run must have something to check.
  if (PAGE_SLUGS.length === 0 || POST_MIGRATION_PAGES.length === 0) {
    throw new Error('Anchor contract self-test failed: the real inputs are empty')
  }

  console.log('Anchor contract self-test passed')
}

function main() {
  if (process.argv.includes(SELF_TEST_FLAG)) {
    runSelfTest()
    return
  }
  if (process.argv.includes(RECORD_FLAG)) {
    record()
    return
  }

  const counts = assertAnchorContract({
    locales: LOCALES,
    pageSlugs: PAGE_SLUGS,
    postMigrationPages: POST_MIGRATION_PAGES,
    legacy: readFixture(LEGACY_FIXTURE),
    postMigration: readFixture(POST_MIGRATION_FIXTURE),
    markdownFor: markdownOnDisk,
  })

  console.log(
    `Anchor contract holds: ${counts.deployed} anchors deployed by GitBook and ` +
      `${counts.recorded} recorded since still resolve, across ${counts.pages} pages.`,
  )
  console.log(
    '  NOT covered: this is a superset check, so a new heading is always allowed; it says nothing ' +
      'about heading wording, and nothing about whether a link points at the right anchor — check:anchors does that.',
  )
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
