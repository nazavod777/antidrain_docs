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

const SELF_TEST_FLAG = '--self-test'

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')

export const stub = (target) => `<!DOCTYPE html>
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

/**
 * Which stubs to write, as a pure function of what the build produced.
 *
 * `entriesIn(lang)` lists a locale directory and `isPageDirectory(lang, entry)`
 * says whether that entry is a page directory holding an index.html. Only page
 * directories get a stub: a stray file would otherwise be given a redirect to
 * a URL that does not exist, and check-urls.mjs would then report it shadowing
 * nothing.
 */
export const stubPlan = ({ locales, entriesIn, isPageDirectory }) =>
  locales.flatMap((lang) =>
    entriesIn(lang)
      .filter((entry) => isPageDirectory(lang, entry))
      .map((entry) => ({ file: `${lang}/${entry}.html`, target: `/${lang}/${entry}/` })),
  )

function expectFailure(handler, expectedFragment, description) {
  try {
    handler()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.includes(expectedFragment)) {
      throw new Error(
        `Redirect stub self-test failed: ${description} reported ${JSON.stringify(message)}`,
      )
    }

    return
  }

  throw new Error(`Redirect stub self-test failed: ${description} was accepted`)
}

function runSelfTest() {
  const body = stub('/ru/quick-start/')
  for (const fragment of [
    'content="0; url=/ru/quick-start/"',
    '<link rel="canonical" href="/ru/quick-start/">',
    '<meta name="robots" content="noindex">',
    'location.replace("/ru/quick-start/")',
  ]) {
    if (!body.includes(fragment)) {
      throw new Error(`Redirect stub self-test failed: the stub does not carry ${fragment}`)
    }
  }
  // The stub must never be indexable in its own right, or the flat URL competes
  // with the directory URL for the same page.
  if (!/robots"\s+content="noindex"/.test(body)) {
    throw new Error('Redirect stub self-test failed: the stub is missing its noindex')
  }
  // The script target is JSON-quoted, so a quote in a path cannot break out.
  if (!stub('/ru/a"b/').includes('location.replace("/ru/a\\"b/")')) {
    throw new Error('Redirect stub self-test failed: the redirect target is not escaped')
  }

  const plan = stubPlan({
    locales: ['ru', 'en'],
    entriesIn: (lang) => (lang === 'ru' ? ['quick-start', 'index.html', 'assets'] : ['faq']),
    isPageDirectory: (lang, entry) => entry !== 'index.html' && entry !== 'assets',
  })
  if (plan.length !== 2) {
    throw new Error(`Redirect stub self-test failed: planned ${JSON.stringify(plan)}`)
  }
  if (plan[0].file !== 'ru/quick-start.html' || plan[0].target !== '/ru/quick-start/') {
    throw new Error(`Redirect stub self-test failed: first stub was ${JSON.stringify(plan[0])}`)
  }
  if (plan[1].file !== 'en/faq.html') {
    throw new Error(`Redirect stub self-test failed: second stub was ${JSON.stringify(plan[1])}`)
  }

  // Guard case: a plan that found nothing must not read as success.
  if (stubPlan({ locales: ['ru'], entriesIn: () => [], isPageDirectory: () => true }).length !== 0) {
    throw new Error('Redirect stub self-test failed: an empty dist produced stubs')
  }

  expectFailure(
    () => stubPlan({ locales: ['ru'], entriesIn: () => { throw new Error('no such locale directory') }, isPageDirectory: () => true }),
    'no such locale directory',
    'a locale directory that cannot be listed',
  )

  console.log('Redirect stub self-test passed')
}

function main() {
  if (process.argv.includes(SELF_TEST_FLAG)) {
    runSelfTest()
    return
  }

  if (!existsSync(DIST)) {
    console.error(`No build output at ${DIST}. Run vitepress build first.`)
    process.exitCode = 1
    return
  }

  const plan = stubPlan({
    locales: ['ru', 'en'],
    entriesIn: (lang) => (existsSync(join(DIST, lang)) ? readdirSync(join(DIST, lang)) : []),
    isPageDirectory: (lang, entry) => {
      const dir = join(DIST, lang, entry)
      // Only page directories — each holds the index.html VitePress emitted.
      return statSync(dir).isDirectory() && existsSync(join(dir, 'index.html'))
    },
  })

  for (const { file, target } of plan) writeFileSync(join(DIST, file), stub(target))

  console.log(`html-stubs: wrote ${plan.length} legacy redirect stub(s) into ${relative(process.cwd(), DIST)}`)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
