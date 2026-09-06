/**
 * Layout, accessibility and console health of the built site.
 *
 * The other checks read source files; this one drives a real browser over
 * `dist/`, because the defects it catches are invisible in the source. Every
 * one of these actually shipped and was found by hand: 6px of horizontal
 * scroll from a table at 390px, 32px touch targets in the mobile drawer, a
 * brand mark that vanished in the light theme, and a sidebar that axe flagged
 * as nested-interactive.
 *
 * Serves `dist/` with GitHub Pages' resolution order — `<path>`, then
 * `<path>.html`, then `<path>/index.html` — because `vitepress preview`
 * resolves extensionless URLs differently and would test the wrong thing. See
 * DEPLOY.md.
 *
 * TARGETED RUNS. `--page` and `--changed` narrow the run to the pages a change
 * could have touched; `--all`, or no flag at all, is the gate. The rule that
 * makes this safe is one-directional: **a targeted run narrows the set of
 * PAGES and never the set of checks per page.** The same six widths in dark,
 * the same two in light, the same axe passes at 390 and 1440. The one thing
 * structurally outside a targeted run is the prefers-reduced-motion pass,
 * because it is a fixed extra pass on one URL rather than a per-page check —
 * and the run says so in its own success line. A targeted run is not the gate.
 */
import { readFileSync, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { join, resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALL_PAGE_URLS, urlForPath } from '../pages.ts'

const SELF_TEST_FLAG = '--self-test'
const PAGE_FLAG = '--page'
const CHANGED_FLAG = '--changed'
const ALL_FLAG = '--all'

const HERE = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(HERE, '../dist')

/** Resolved through node, not a hand-built path, so a hoist cannot break it. */
const findAxe = () => {
  try {
    return createRequire(import.meta.url).resolve('axe-core/axe.min.js')
  } catch {
    return null
  }
}

/**
 * Page types that exercise different layout paths.
 *
 * Ten URLs, not ten pages: each one is here because it renders a combination
 * nothing else does. The site serves 33 page URLs, so this list deliberately
 * leaves most of them unrendered — DEPLOY.md records that as a named gap, and
 * the success line below repeats the number rather than letting it be
 * mistaken for full coverage. Every URL is checked against pages.ts on start,
 * because a typo here used to mean a silent 404 that still passed.
 */
const GATE_PAGES = [
  { url: '/', label: 'root landing (no sidebar, no search)' },
  { url: '/ru/', label: 'RU locale index' },
  { url: '/en/', label: 'EN locale index' },
  { url: '/ru/service-fees/', label: 'RU table + callouts' },
  { url: '/ru/troubleshooting/', label: 'RU widest table' },
  { url: '/en/rescue-actions/', label: 'EN table + callouts' },
  // The only pages carrying screenshots — a wide image is the most likely
  // source of horizontal scroll, so both languages are checked.
  { url: '/ru/quick-start/', label: 'RU screenshots' },
  { url: '/en/quick-start/', label: 'EN screenshots' },
  { url: '/ru/rescue-actions/', label: 'RU screenshot + table' },
  { url: '/ru/donor-wallet/', label: 'RU screenshot in a section' },
]

/** From AGENTS.md: the site scale plus the two VitePress breakpoints. */
const WIDTHS = [390, 480, 768, 1024, 1280, 1440]
/** axe is slow, so it runs at the extremes rather than every width. */
const AXE_WIDTHS = new Set([390, 1440])
/** Below this VitePress turns the sidebar into a drawer — a touch context. */
const DRAWER_BELOW = 960
const MIN_TOUCH_TARGET = 44
/** The one URL the reduced-motion pass visits. */
const REDUCED_MOTION_URL = '/ru/quick-start/'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
}

/** GitHub Pages' static resolution, as relative paths, in the order it tries. */
export const candidatePaths = (urlPath) => {
  const rel = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '')
  return urlPath.endsWith('/') ? [join(rel, 'index.html')] : [rel, `${rel}.html`, join(rel, 'index.html')]
}

/** Every URL curated above must be a page pages.ts actually produces. */
export const assertGatePagesExist = (gatePages, knownUrls) => {
  const unknown = gatePages.map(({ url }) => url).filter((url) => !knownUrls.includes(url))
  if (unknown.length) {
    throw new Error(
      `GATE_PAGES names ${unknown.length} URL(s) that pages.ts does not produce: ${unknown.join(', ')}\n` +
      '    the server would answer 404 and the page would still be reported as checked',
    )
  }
  return gatePages.length
}

/**
 * How many browser navigations a run performs. Counted rather than inferred,
 * because the old success line reported 80 while the script did 81 — the
 * reduced-motion pass was never added to the tally, so the check under-reported
 * itself.
 */
export const plannedNavigations = (pageCount, widths, axeWidths, withReducedMotion) => {
  const perPage = widths.length + widths.filter((w) => axeWidths.has(w)).length
  return pageCount * perPage + (withReducedMotion ? 1 : 0)
}

/**
 * Which pages this invocation renders, and why.
 *
 * `--page` names a URL or a docs path directly; a value that is not a page is
 * a typo and stops the run. `--changed` takes whatever a diff produced, and a
 * path that is not a page markdown file is not localised to one URL — a theme
 * token or a script can change every page — so the run escalates to the full
 * gate and says why. Narrowing is only ever safe in the direction of doing
 * more work.
 */
export const parseSelection = (argv, gatePages) => {
  const wanted = []
  const escalations = []
  let sawSelector = false

  const take = (flag, values) => {
    if (values.length === 0) throw new Error(`${flag} needs at least one page or path`)
    for (const value of values) {
      const url = urlForPath(value)
      if (url !== null) {
        if (!wanted.includes(url)) wanted.push(url)
        continue
      }
      if (flag === PAGE_FLAG) {
        throw new Error(
          `${PAGE_FLAG} ${value} is not a page.\n` +
          '    give a URL (/ru/glossary/) or a source path (docs/ru/glossary.md)',
        )
      }
      escalations.push(value)
    }
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === ALL_FLAG) { sawSelector = true; continue }
    if (arg !== PAGE_FLAG && arg !== CHANGED_FLAG) continue
    sawSelector = true
    const values = []
    while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) values.push(argv[++i])
    take(arg, values)
  }

  const full = {
    mode: 'gate',
    pages: gatePages,
    withReducedMotion: true,
    escalations,
  }
  if (!sawSelector || argv.includes(ALL_FLAG)) return full
  if (escalations.length) return { ...full, mode: 'escalated' }
  if (wanted.length === 0) return full

  const labelled = new Map(gatePages.map(({ url, label }) => [url, label]))
  return {
    mode: 'targeted',
    pages: wanted.map((url) => ({ url, label: labelled.get(url) ?? 'targeted page' })),
    withReducedMotion: false,
    escalations,
  }
}

/** The lines a run prints about what it did NOT do. Never empty. */
export const notCoveredLines = (selection, { gatePages, allPageUrls }) => {
  const uncovered = allPageUrls.filter((url) => !selection.pages.some((p) => p.url === url))
  const lines = []

  if (selection.mode === 'targeted') {
    const onGate = selection.pages.filter((p) => gatePages.some((g) => g.url === p.url)).length
    lines.push(
      `${selection.pages.length} page(s) checked, ${onGate} of the ${gatePages.length} gate pages — ` +
        'a targeted run is NOT the gate. Run `npm run build` before reporting anything as done.',
    )
    lines.push(
      'NOT covered by a targeted run: the prefers-reduced-motion pass — it is a fixed extra pass on ' +
        `${REDUCED_MOTION_URL}, structurally outside the per-page loop. Both themes ARE covered: the ` +
        'theme loop runs inside the page loop, so a narrower page set keeps dark and light.',
    )
  }
  if (selection.mode === 'escalated') {
    lines.push(
      `escalated to the full gate: ${selection.escalations.join(', ')} ` +
        'is not page markdown, so its effect is not localised to one URL.',
    )
  }
  lines.push(
    `NOT covered: ${uncovered.length} of the ${allPageUrls.length} page URLs this site serves. ` +
      'The gate list is layout types, not a page list — DEPLOY.md records the gap.',
  )
  return lines
}

function expectFailure(handler, expectedFragment, description) {
  try {
    handler()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.includes(expectedFragment)) {
      throw new Error(
        `Layout check self-test failed: ${description} reported ${JSON.stringify(message)}`,
      )
    }

    return
  }

  throw new Error(`Layout check self-test failed: ${description} was accepted`)
}

/**
 * Pure by construction: this gate needs a build and a browser, and neither
 * belongs in a one-second loop. So the self-test exercises the decisions —
 * URL resolution order, page selection, the navigation tally, and the lines
 * about what was skipped — and never opens a page.
 */
function runSelfTest() {
  // GitHub Pages' resolution order, which `vitepress preview` does not share.
  if (candidatePaths('/ru/faq/').join('|') !== 'ru/faq/index.html') {
    throw new Error(`Layout check self-test failed: directory URL resolved to ${candidatePaths('/ru/faq/')}`)
  }
  if (candidatePaths('/ru/faq').join('|') !== 'ru/faq|ru/faq.html|ru/faq/index.html') {
    throw new Error(`Layout check self-test failed: extensionless URL resolved to ${candidatePaths('/ru/faq')}`)
  }
  if (candidatePaths('/assets/a.css?v=1').join('|') !== 'assets/a.css|assets/a.css.html|assets/a.css/index.html') {
    throw new Error('Layout check self-test failed: the query string was not stripped')
  }

  // Every curated URL is a real page. This is the check that would have caught
  // a typo answering 404 while still counting as a passing render.
  if (assertGatePagesExist(GATE_PAGES, ALL_PAGE_URLS) !== 10) {
    throw new Error('Layout check self-test failed: the gate list changed size without this test noticing')
  }
  expectFailure(
    () => assertGatePagesExist([{ url: '/ru/nope/', label: 'typo' }], ALL_PAGE_URLS),
    'GATE_PAGES names 1 URL(s) that pages.ts does not produce: /ru/nope/',
    'a curated URL with no page behind it',
  )

  // The real tally: 10 pages x (6 dark + 2 light) + 1 reduced-motion pass.
  const full = plannedNavigations(GATE_PAGES.length, WIDTHS, AXE_WIDTHS, true)
  if (full !== 81) {
    throw new Error(`Layout check self-test failed: the gate plans ${full} navigations, expected 81`)
  }
  if (plannedNavigations(1, WIDTHS, AXE_WIDTHS, false) !== 8) {
    throw new Error('Layout check self-test failed: one targeted page is not eight navigations')
  }

  const gate = parseSelection([], GATE_PAGES)
  if (gate.mode !== 'gate' || gate.pages.length !== 10 || !gate.withReducedMotion) {
    throw new Error(`Layout check self-test failed: a bare run selected ${JSON.stringify(gate.mode)}`)
  }
  if (parseSelection([ALL_FLAG], GATE_PAGES).pages.length !== 10) {
    throw new Error('Layout check self-test failed: --all is not the full gate')
  }

  const targeted = parseSelection([CHANGED_FLAG, 'docs/ru/glossary.md'], GATE_PAGES)
  if (targeted.mode !== 'targeted' || targeted.pages.length !== 1) {
    throw new Error(`Layout check self-test failed: --changed selected ${JSON.stringify(targeted.pages)}`)
  }
  if (targeted.pages[0].url !== '/ru/glossary/' || targeted.withReducedMotion) {
    throw new Error('Layout check self-test failed: a targeted run kept the reduced-motion pass')
  }
  // A gate page keeps its curated label rather than becoming anonymous.
  if (parseSelection([PAGE_FLAG, '/ru/quick-start/'], GATE_PAGES).pages[0].label !== 'RU screenshots') {
    throw new Error('Layout check self-test failed: a targeted gate page lost its label')
  }
  // Two flags, several values, and a duplicate that must collapse.
  const many = parseSelection(
    [PAGE_FLAG, '/ru/faq/', '/en/faq/', CHANGED_FLAG, 'docs/ru/faq.md'],
    GATE_PAGES,
  )
  if (many.pages.length !== 2) {
    throw new Error(`Layout check self-test failed: expected two distinct pages, got ${many.pages.length}`)
  }

  // The safety direction: something that is not a page escalates to the gate.
  const escalated = parseSelection([CHANGED_FLAG, 'docs/.vitepress/theme/tokens.css'], GATE_PAGES)
  if (escalated.mode !== 'escalated' || escalated.pages.length !== 10 || !escalated.withReducedMotion) {
    throw new Error('Layout check self-test failed: a theme change did not escalate to the full gate')
  }
  const mixed = parseSelection([CHANGED_FLAG, 'docs/ru/faq.md', 'docs/.vitepress/theme/base.css'], GATE_PAGES)
  if (mixed.mode !== 'escalated' || mixed.pages.length !== 10) {
    throw new Error('Layout check self-test failed: a mixed diff narrowed the run')
  }

  expectFailure(
    () => parseSelection([PAGE_FLAG, 'docs/ru/nope.md'], GATE_PAGES),
    '--page docs/ru/nope.md is not a page',
    'a --page value that names nothing',
  )
  expectFailure(
    () => parseSelection([PAGE_FLAG], GATE_PAGES),
    '--page needs at least one page or path',
    'a selector with no value',
  )

  // The gap the success line has to name: 33 URLs served, 10 rendered.
  const gateLines = notCoveredLines(gate, { gatePages: GATE_PAGES, allPageUrls: ALL_PAGE_URLS })
  if (!gateLines.some((l) => l.includes('NOT covered: 23 of the 33 page URLs'))) {
    throw new Error(`Layout check self-test failed: the gate did not name its gap — ${gateLines.join(' / ')}`)
  }
  const targetedLines = notCoveredLines(targeted, { gatePages: GATE_PAGES, allPageUrls: ALL_PAGE_URLS })
  if (!targetedLines.some((l) => l.includes('a targeted run is NOT the gate'))) {
    throw new Error('Layout check self-test failed: a targeted run did not disclaim itself')
  }
  if (!targetedLines.some((l) => l.includes('prefers-reduced-motion') && l.includes('Both themes ARE covered'))) {
    throw new Error('Layout check self-test failed: the skipped pass is not named exactly')
  }
  if (!targetedLines.some((l) => l.includes('0 of the 10 gate pages'))) {
    throw new Error('Layout check self-test failed: a page outside the gate list was counted as gate coverage')
  }
  if (gateLines.length === 0 || targetedLines.length === 0) {
    throw new Error('Layout check self-test failed: a run reported nothing about what it skipped')
  }

  console.log('Layout check self-test passed')
}

async function main() {
  if (process.argv.includes(SELF_TEST_FLAG)) {
    runSelfTest()
    return
  }

  assertGatePagesExist(GATE_PAGES, ALL_PAGE_URLS)
  const selection = parseSelection(process.argv.slice(2), GATE_PAGES)
  const PAGES = selection.pages

  const resolveFile = (urlPath) =>
    candidatePaths(urlPath)
      .map((c) => join(DIST, c))
      .find((c) => existsSync(c) && statSync(c).isFile())

  const startServer = () =>
    new Promise((ready) => {
      const server = createServer((req, res) => {
        const file = resolveFile(req.url)
        if (!file) {
          res.writeHead(404).end('not found')
          return
        }
        const body = readFileSync(file)
        res.writeHead(200, {
          'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
          'Content-Length': body.length,
        })
        res.end(body)
      })
      server.listen(0, '127.0.0.1', () => ready({ server, port: server.address().port }))
    })

  const failures = []
  const fail = (where, message) => failures.push(`${where}\n    ${message}`)

  if (!existsSync(DIST)) {
    console.error(`No build output at ${DIST}. Run the build first.`)
    process.exitCode = 1
    return
  }

  // A targeted page that is not in dist would answer 404 and still be reported
  // as rendered. Catch it before the browser starts.
  const notBuilt = PAGES.filter(({ url }) => !resolveFile(url))
  if (notBuilt.length) {
    console.error(`Not in dist: ${notBuilt.map((p) => p.url).join(', ')}`)
    console.error('Run the build first — a URL that 404s would otherwise pass every check.')
    process.exitCode = 1
    return
  }

  let chromium
  try {
    ;({ chromium } = await import('playwright'))
  } catch {
    console.error('playwright is not installed. Run `npm ci`.')
    process.exitCode = 1
    return
  }

  const { server, port } = await startServer()
  let browser

  // Everything below holds two things that keep the event loop alive: a listening socket and a
  // Chromium. Teardown therefore belongs in `finally` and not on the happy path — a throw halfway
  // through the run used to leave both alive, and `main().catch()` would set process.exitCode on a
  // process that then never exited. A hung gate is worse than a failed one: CI waits for its
  // timeout and a person reads a live terminal as work still in progress.
  try {
    const BASE = `http://127.0.0.1:${port}`
    const axePath = findAxe()
    const axeSource = axePath ? readFileSync(axePath, 'utf8') : null
    if (!axeSource) {
      console.error('axe-core is not installed, so the accessibility pass cannot run.')
      console.error('Run `npm ci`. Refusing to report a pass without it.')
      process.exitCode = 1
      return
    }

    /**
     * Prefer Playwright's own browser, then an explicit override, then whatever
     * Chromium the machine has. CI installs Playwright's; a dev box often already
     * has a system one, and there is no reason to make that a manual step.
     */
    const SYSTEM_CHROMIUM = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/usr/bin/google-chrome',
      '/snap/bin/chromium',
    ]

    const launchCandidates = [
      ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
        ? [{ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }]
        : []),
      {},
      ...SYSTEM_CHROMIUM.filter((path) => existsSync(path)).map((executablePath) => ({
        executablePath,
      })),
    ]

    let lastError
    for (const options of launchCandidates) {
      try {
        browser = await chromium.launch(options)
        break
      } catch (error) {
        lastError = error
      }
    }

    if (!browser) {
      console.error('Could not launch Chromium for the layout check.')
      console.error(`  ${String(lastError).split('\n')[0]}`)
      console.error('  Install it with `npx playwright install chromium`, or set')
      console.error('  PLAYWRIGHT_CHROMIUM_PATH to a Chromium binary.')
      process.exitCode = 1
      return
    }

    let navigations = 0

    // The theme loop is OUTSIDE the width loop and INSIDE nothing else that a
    // targeted run narrows — which is why narrowing PAGES keeps both themes.
    for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({ colorScheme: theme })
      // Stamp the preference before first paint so nothing is measured mid
      // transition — VitePress cross-fades colours over 0.5s.
      await context.addInitScript(
        `try { localStorage.setItem('vitepress-theme-appearance', '${theme}') } catch {}`,
      )
      const page = await context.newPage()

      const consoleProblems = []
      page.on('pageerror', (e) => consoleProblems.push(`page error: ${String(e).slice(0, 160)}`))
      page.on('console', (m) => {
        if (m.type() === 'error') consoleProblems.push(`console error: ${m.text().slice(0, 160)}`)
      })
      page.on('requestfailed', (r) => consoleProblems.push(`request failed: ${r.url().slice(0, 160)}`))

      for (const width of WIDTHS) {
        // Light theme only needs the extremes; layout does not vary by palette.
        if (theme === 'light' && !AXE_WIDTHS.has(width)) continue

        await page.setViewportSize({ width, height: 900 })

        for (const { url, label } of PAGES) {
          const where = `${theme} ${width}px ${url}  (${label})`
          consoleProblems.length = 0

          await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle' })
          await page.waitForTimeout(120)
          navigations++

          const applied = await page.evaluate(() =>
            document.documentElement.classList.contains('dark'),
          )
          if (applied !== (theme === 'dark')) {
            fail(where, `theme not applied before measuring (html.dark=${applied})`)
          }

          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          )
          if (overflow > 0) {
            const culprits = await page.evaluate((vw) =>
              [...document.querySelectorAll('body *')]
                .filter((el) => el.getBoundingClientRect().right > vw + 1)
                .slice(0, 3)
                .map((el) => {
                  const cls = (el.className || '').toString().trim().split(/\s+/).slice(0, 2).join('.')
                  return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`
                }), width)
            fail(where, `page scrolls sideways by ${overflow}px — widest: ${culprits.join(', ') || 'unknown'}`)
          }

          if (width < DRAWER_BELOW) {
            // The drawer is a touch context whatever the pointer reports.
            const opener = page.locator('.VPNavBarHamburger')
            if (await opener.count()) {
              try {
                await opener.first().click({ timeout: 2500 })
                await page.waitForTimeout(350)
              } catch {
                /* not shown at this width; the local-nav button covers it */
              }
            }
            const small = await page.evaluate((min) => {
              const visible = (el) =>
                el.getBoundingClientRect().height > 0 && getComputedStyle(el).visibility !== 'hidden'
              return [
                ...document.querySelectorAll(
                  '.VPSidebarItem.is-link > .item > .link, .lang-toggle, .VPSocialLink, .VPNavBarMenu .VPNavBarMenuLink',
                ),
              ]
                .filter(visible)
                .map((el) => ({
                  what: (el.textContent || el.getAttribute('aria-label') || el.className).toString().trim().slice(0, 28),
                  h: Math.round(el.getBoundingClientRect().height),
                }))
                .filter((x) => x.h < min)
            }, MIN_TOUCH_TARGET)
            if (small.length) {
              const shown = small.slice(0, 3).map((s) => `"${s.what}" ${s.h}px`).join(', ')
              fail(where, `${small.length} touch target(s) under ${MIN_TOUCH_TARGET}px: ${shown}`)
            }
            await page.keyboard.press('Escape').catch(() => {})
          }

          if (axeSource && AXE_WIDTHS.has(width)) {
            await page.addScriptTag({ content: axeSource })
            const violations = await page.evaluate(async () => {
              const result = await window.axe.run(document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
              })
              return result.violations.map((v) => ({
                id: v.id,
                impact: v.impact,
                n: v.nodes.length,
                target: v.nodes[0]?.target?.join(' ')?.slice(0, 70),
              }))
            })
            for (const v of violations) {
              fail(where, `axe ${v.id} [${v.impact}] x${v.n} — ${v.target}`)
            }
          }

          for (const problem of consoleProblems) fail(where, problem)
        }
      }

      await context.close()
    }

    // VitePress already suppresses transitions under reduced motion, and base.css
    // repeats the blanket, so the baseline is covered twice over. What this catches
    // is the regression that actually shipped in the GitBook era: an author rule
    // carrying `!important` outranks the blanket, and the sidebar keeps animating
    // for someone who asked it not to. Verified by adding exactly such a rule.
    //
    // It is a fixed extra pass on one URL, not a per-page check, which is exactly
    // why a targeted run cannot include it and has to declare that it did not.
    if (selection.withReducedMotion) {
      const context = await browser.newContext({ reducedMotion: 'reduce' })
      const page = await context.newPage()
      await page.goto(`${BASE}${REDUCED_MOTION_URL}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(120)
      navigations++
      const animated = await page.evaluate(() =>
        ['.VPSidebar', '.VPNav', '.vp-doc a']
          .map((selector) => {
            const el = document.querySelector(selector)
            if (!el) return null
            const seconds = getComputedStyle(el)
              .transitionDuration.split(',')
              .map((v) => parseFloat(v))
            return Math.max(...seconds) > 0.01 ? `${selector} ${getComputedStyle(el).transitionDuration}` : null
          })
          .filter(Boolean),
      )
      if (animated.length) {
        fail('prefers-reduced-motion: reduce', `still animating: ${animated.join('; ')}`)
      }
      await context.close()
    }

    const planned = plannedNavigations(PAGES.length, WIDTHS, AXE_WIDTHS, selection.withReducedMotion)
    if (navigations !== planned) {
      fail('run accounting', `performed ${navigations} navigation(s) but planned ${planned}`)
    }

    if (failures.length) {
      console.error('Layout check FAILED:\n')
      for (const f of failures) console.error(`  ${f}\n`)
      console.error(`${failures.length} problem(s) across ${navigations} navigation(s).`)
      process.exitCode = 1
      return
    }

    console.log(
      `Layout check passed: ${navigations} navigation(s) over ${PAGES.length} page(s) — ` +
        `${WIDTHS.length} widths in dark, ${[...AXE_WIDTHS].length} in light, axe at ` +
        `${[...AXE_WIDTHS].join(' and ')}${selection.withReducedMotion ? ', plus one prefers-reduced-motion pass' : ''}.`,
    )
    console.log('  no sideways scroll, no small touch targets, no axe violations, no console errors.')
    for (const line of notCoveredLines(selection, { gatePages: GATE_PAGES, allPageUrls: ALL_PAGE_URLS })) {
      console.log(`  ${line}`)
    }
  } finally {
    // Reverse of the order they were acquired in, and teardown never replaces the real error: an
    // already-dead browser rejects here, and that rejection would be the only thing anyone saw.
    if (browser) await browser.close().catch(() => {})
    server.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
