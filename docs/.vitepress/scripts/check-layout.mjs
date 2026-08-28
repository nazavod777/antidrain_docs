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
 */
import { readFileSync, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { join, resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

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

/** Page types that exercise different layout paths. */
const PAGES = [
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

/** GitHub Pages' static resolution, so URL behaviour matches production. */
const resolveFile = (urlPath) => {
  const rel = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '')
  const candidates = urlPath.endsWith('/')
    ? [join(DIST, rel, 'index.html')]
    : [join(DIST, rel), join(DIST, `${rel}.html`), join(DIST, rel, 'index.html')]
  return candidates.find((c) => existsSync(c) && statSync(c).isFile())
}

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
  process.exit(1)
}

let chromium
try {
  ;({ chromium } = await import('playwright'))
} catch {
  console.error('playwright is not installed. Run `npm ci`.')
  process.exit(1)
}

const { server, port } = await startServer()
const BASE = `http://127.0.0.1:${port}`
const axePath = findAxe()
const axeSource = axePath ? readFileSync(axePath, 'utf8') : null
if (!axeSource) {
  console.error('axe-core is not installed, so the accessibility pass cannot run.')
  console.error('Run `npm ci`. Refusing to report a pass without it.')
  server.close()
  process.exit(1)
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

let browser
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
  server.close()
  console.error('Could not launch Chromium for the layout check.')
  console.error(`  ${String(lastError).split('\n')[0]}`)
  console.error('  Install it with `npx playwright install chromium`, or set')
  console.error('  PLAYWRIGHT_CHROMIUM_PATH to a Chromium binary.')
  process.exit(1)
}

let pagesChecked = 0

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
      pagesChecked++

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
{
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(`${BASE}/ru/quick-start/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(120)
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

await browser.close()
server.close()

if (failures.length) {
  console.error('Layout check FAILED:\n')
  for (const f of failures) console.error(`  ${f}\n`)
  console.error(`${failures.length} problem(s) across ${pagesChecked} page render(s).`)
  process.exit(1)
}
console.log(
  `Layout check passed: ${pagesChecked} page render(s) across ${WIDTHS.length} widths and both themes — ` +
    'no sideways scroll, no small touch targets, no axe violations, no console errors.',
)
