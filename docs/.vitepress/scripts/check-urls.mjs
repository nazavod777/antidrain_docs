/**
 * Verifies the built site still serves every URL the live site serves.
 *
 * The deployed URL list is derived from the GitBook `_book` output, so this is
 * a direct before/after comparison rather than an assumption about how
 * VitePress lays out its dist. Run after `vitepress build`.
 *
 * The page list is NOT repeated here — it comes from ../pages.ts, the same
 * module config.ts builds the sidebar from. It used to be a second copy, which
 * meant a page added to config.ts and forgotten here was never checked at all.
 * Which of those pages predate the GitBook migration is recorded once, in
 * check-slugs.mjs's POST_MIGRATION_PAGES; this check does not care, because
 * every page must resolve whatever its history.
 */
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CONTENT_PAGE_SLUGS, LOCALES } from '../pages.ts'

const SELF_TEST_FLAG = '--self-test'

const HERE = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(HERE, '../dist')

/** Every URL the site must answer, and the file that must back it. */
export const expectedUrls = (locales, pages) => [
  ['/', 'index.html'],
  ...locales.flatMap((lang) => [
    [`/${lang}/`, `${lang}/index.html`],
    ...pages.flatMap((page) => [
      [`/${lang}/${page}/`, `${lang}/${page}/index.html`],
      // Legacy flat URL, redirect stub.
      [`/${lang}/${page}.html`, `${lang}/${page}.html`],
    ]),
  ]),
]

/**
 * The whole check, as a pure function of injected content.
 *
 * `fileExists` answers for a path inside dist; `entriesIn` lists a locale
 * directory. Injecting both is what lets the self-test exercise a missing page
 * and a shadowing stub without a build.
 *
 * Returns the number of URLs proved, and throws naming every problem.
 */
export const assertUrlContract = ({ locales, pages, fileExists, entriesIn }) => {
  const expected = expectedUrls(locales, pages)
  const missing = expected.filter(([, file]) => !fileExists(file))

  // Anything served that the old site did not have is fine, but an orphaned
  // top-level .html next to a directory of the same name would shadow it.
  const shadowed = []
  for (const lang of locales) {
    for (const entry of entriesIn(lang)) {
      if (!entry.endsWith('.html') || entry === 'index.html') continue
      const name = entry.replace(/\.html$/, '')
      if (!pages.includes(name)) shadowed.push(`${lang}/${entry}`)
    }
  }

  if (missing.length || shadowed.length) {
    const lines = []
    if (missing.length) {
      lines.push(`${missing.length} live URL(s) would 404 after this build:`, '')
      for (const [url, file] of missing) lines.push(`  ${url}  (expected ${file})`)
    }
    if (shadowed.length) lines.push('', `Unexpected stub file(s): ${shadowed.join(', ')}`)
    throw new Error(lines.join('\n'))
  }

  return expected.length
}

function expectFailure(handler, expectedFragment, description) {
  try {
    handler()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.includes(expectedFragment)) {
      throw new Error(
        `URL contract self-test failed: ${description} reported ${JSON.stringify(message)}`,
      )
    }

    return
  }

  throw new Error(`URL contract self-test failed: ${description} was accepted`)
}

function runSelfTest() {
  const locales = ['ru', 'en']
  const pages = ['alpha', 'beta']
  const complete = new Set(expectedUrls(locales, pages).map(([, file]) => file))
  const entriesIn = (lang) => [`alpha.html`, `beta.html`, 'index.html', `${lang}-note.txt`]

  const proved = assertUrlContract({
    locales,
    pages,
    fileExists: (file) => complete.has(file),
    entriesIn,
  })
  // 1 root + per locale (1 index + 2 pages x 2 forms) = 1 + 2 * 5.
  if (proved !== 11) {
    throw new Error(`URL contract self-test failed: expected 11 URLs, counted ${proved}`)
  }

  expectFailure(
    () =>
      assertUrlContract({
        locales,
        pages,
        fileExists: (file) => complete.has(file) && file !== 'ru/beta/index.html',
        entriesIn,
      }),
    '/ru/beta/  (expected ru/beta/index.html)',
    'a page that stopped being generated',
  )

  expectFailure(
    () =>
      assertUrlContract({
        locales,
        pages,
        fileExists: (file) => complete.has(file) && file !== 'index.html',
        entriesIn,
      }),
    '/  (expected index.html)',
    'the root language picker going missing',
  )

  expectFailure(
    () =>
      assertUrlContract({
        locales,
        pages,
        fileExists: (file) => complete.has(file),
        entriesIn: (lang) => [...entriesIn(lang), 'gamma.html'],
      }),
    'Unexpected stub file(s): ru/gamma.html, en/gamma.html',
    'a stub with no page behind it',
  )

  // The page list is imported, not restated. A self-test that passed against an
  // empty list would prove nothing about the real run.
  if (CONTENT_PAGE_SLUGS.length === 0 || LOCALES.length !== 2) {
    throw new Error('URL contract self-test failed: pages.ts produced no pages to check')
  }

  console.log('URL contract self-test passed')
}

function main() {
  if (process.argv.includes(SELF_TEST_FLAG)) {
    runSelfTest()
    return
  }

  const total = assertUrlContract({
    locales: LOCALES,
    pages: CONTENT_PAGE_SLUGS,
    fileExists: (file) => existsSync(join(DIST, file)),
    entriesIn: (lang) => (existsSync(join(DIST, lang)) ? readdirSync(join(DIST, lang)) : []),
  })

  console.log(`URL contract holds: all ${total} live URLs are backed by a file.`)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
