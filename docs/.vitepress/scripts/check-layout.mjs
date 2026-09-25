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
 * COVERAGE. The gate renders every page URL `pages.ts` produces, at one of two
 * depths. The ten layout types in GATE_PAGES get FULL_DEPTH — six widths in
 * dark, the two extremes in light. Every other URL gets SWEEP_DEPTH, a subset
 * that keeps both themes at both extremes and drops only the three middle dark
 * widths. The sweep is derived from `pages.ts`, so a page added there is
 * rendered without anyone remembering to list it.
 *
 * CONCURRENCY. Each navigation is one task with its own browser context, page,
 * emulation and error collectors, and a bounded pool runs several at once over
 * one shared, read-only static server. Nothing a task measures can leak into
 * another, and findings are kept per task and printed in plan order — page,
 * then theme, then width — so the output does not depend on which task happened
 * to finish first.
 *
 * TARGETED RUNS. `--page` and `--changed` narrow the run to the pages a change
 * could have touched; `--all`, or no flag at all, is the gate. The rule that
 * makes this safe is one-directional: **a targeted run narrows the set of
 * PAGES and never the set of checks per page.** Every targeted page gets full
 * depth, even one the gate only sweeps. The one thing structurally outside a
 * targeted run is the pair of fixed extra passes — reduced motion and forced
 * colours — and the run says so in its own success line. A targeted run is not
 * the gate.
 */
import { readFileSync, existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { join, resolve, dirname, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { ALL_PAGE_URLS, urlForPath } from '../pages.ts'
// The browser choice, and the refusal that goes with it, live in the card renderer — see the long
// note on `launchCandidates` there for why this gate imports a generator rather than keeping a
// second copy of the same decision. Importing it runs nothing: playwright is loaded inside its
// `main()`, and that `main()` is guarded.
import { launchCandidates } from './shoot-og-image.mjs'

const SELF_TEST_FLAG = '--self-test'
const PAGE_FLAG = '--page'
const CHANGED_FLAG = '--changed'
const ALL_FLAG = '--all'
const CONCURRENCY_FLAG = '--concurrency'

const HERE = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(HERE, '../dist')
const REPO_ROOT = resolve(HERE, '../../..')

/** Resolved through node, not a hand-built path, so a hoist cannot break it. */
const findAxe = () => {
  try {
    return createRequire(import.meta.url).resolve('axe-core/axe.min.js')
  } catch {
    return null
  }
}

/**
 * Page types that exercise different layout paths, rendered at full depth.
 *
 * Ten URLs, not ten pages: each one is here because it renders a combination
 * nothing else does. Every other URL the site serves is swept at SWEEP_DEPTH
 * rather than left unrendered. Every URL is checked against pages.ts on start,
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

const SWEPT_LABEL = 'swept page'

/** Dark is the default; both themes are mandatory. Order is the order findings print in. */
const THEMES = ['dark', 'light']
/** From AGENTS.md: the site scale plus the two VitePress breakpoints. */
const WIDTHS = [390, 480, 768, 1024, 1280, 1440]
/** axe is slow, so it runs at the extremes rather than every width — in every theme rendered. */
const AXE_WIDTHS = new Set([390, 1440])
/** Below this VitePress turns the sidebar into a drawer — a touch context. */
const DRAWER_BELOW = 960
const MIN_TOUCH_TARGET = 44

/**
 * The layout types: every width in dark, the extremes in light, because layout does not vary by
 * palette while contrast does. Every targeted page gets this depth too.
 */
export const FULL_DEPTH = {
  name: 'full',
  widths: { dark: WIDTHS, light: WIDTHS.filter((width) => AXE_WIDTHS.has(width)) },
}

/**
 * Every other page URL. It keeps what varies per page — the content — at the widths where content
 * breaks: 390 (the phone, where a wide table or an unbreakable string overflows first), 1024 (the
 * narrowest content column once the sidebar is shown at 960) and 1440, in dark; and both extremes in
 * light, so axe reads the content's contrast in both palettes at both ends. What it drops, 480, 768
 * and 1280 in dark, is chrome that every page shares and the ten layout types already render.
 */
export const SWEEP_DEPTH = {
  name: 'sweep',
  widths: { dark: [390, 1024, 1440], light: [390, 1440] },
}

/** The one URL the reduced-motion pass visits. */
const REDUCED_MOTION_URL = '/ru/quick-start/'

/**
 * The forced-colours pass visits the same page as the reduced-motion one, for the same reason: it
 * is one representative doc page carrying the header, the sidebar and prose at once. Both themes,
 * because the defect this exists for only occurs in one of them, and 1440px because the control it
 * measures is `display: none` below 768.
 */
const FORCED_COLORS_URL = '/ru/quick-start/'
const FORCED_COLORS_THEMES = ['dark', 'light']
const FORCED_COLORS_WIDTH = 1440

/**
 * How many navigations run at once. The run is dominated by fixed waits and `networkidle`, not by
 * CPU. Measured on 25.09.2026 over the 198-navigation gate on a 32-thread machine: 67 s at four
 * workers, 48 s at six, 38–39 s at eight, 31 s at twelve; at eight the whole run used about 52 CPU
 * seconds, under two cores on average, which leaves headroom on a small CI runner. Twelve buys eight
 * more seconds for half again the peak load, so eight it is. `--concurrency 1` runs the same plan
 * sequentially, which is how a parallel result is compared against a sequential one.
 */
export const DEFAULT_CONCURRENCY = 8
const MAX_CONCURRENCY = 16

/**
 * Teardown bounds. After a failure the browser is closed first, which makes every in-flight
 * Playwright call reject promptly; the pool then waits for those tasks to settle before the server
 * goes. Each wait is bounded, because a teardown that can itself hang is the defect being fixed.
 */
const BROWSER_CLOSE_TIMEOUT_MS = 10_000
const IN_FLIGHT_SETTLE_TIMEOUT_MS = 10_000

/**
 * The teardown probe: a child process that runs real tasks against dist/ and has one of them throw
 * after the browser and the server are both up. It must end by itself, non-zero, for the injected
 * reason. Measured at 2.6 s on the machine above; the deadline is more than ten times that, so a
 * slow CI runner does not read as a hang, and it still ends a hung probe instead of waiting on CI.
 */
export const TEARDOWN_DEADLINE_MS = 30_000
export const TEARDOWN_PROBE_MARKER = 'layout teardown probe: injected failure'
const PROBE_CONCURRENCY = 2
/** The task whose completion throws. With two workers, the third task is in flight at that moment. */
const PROBE_FAIL_AFTER = 2

/**
 * Above this many distinct colours, a text-node crop is read as carrying a legible label rather
 * than a flat fill. A legible label's anti-aliased edges alone produce dozens; a label lost to
 * Chromium's forced-colours backplate is not perfectly flat either, because hinting leaks a thin
 * halo where the plate does not quite cover an ascender. Measured in this repository before and
 * after the fix in tokens.css: the header CTA's label read 3 (RU) and 2 (EN) while lost, 241 and
 * 221 once repaired, and legible labels elsewhere on the same page read 248–408. The floor sits
 * with margin on both sides of that gap. Same number, and the same method, as the site's
 * `e2e/support/glyphVisibility.ts` — kept as an independent copy because neither repository may
 * import the other.
 */
export const READABLE_LABEL_COLOUR_FLOOR = 15

/**
 * What the forced-colours pass samples, and why each one is here.
 *
 * The mode remaps this theme's palette onto system colours, and that is silently lossy in one
 * direction: a control filled with `--color-accent` and inked with `--color-on-accent` resolves to
 * `background: CanvasText; color: Canvas` in the dark theme — and `Canvas` is also the colour
 * Chromium paints the backplate behind every glyph, so the label is painted onto a plate of its own
 * colour and disappears. `getComputedStyle` reports two different, individually fine-looking
 * values for that (21:1 on paper), which is why nothing short of decoded pixels can see it.
 *
 * The second entry is a control in the strict sense: it is a plain label on the page surface that
 * has never been filled, so it must stay legible in every mode. It is here so that a measurement
 * which has quietly started reading the wrong thing — an empty crop, a raster the emulation never
 * reached — fails as well, instead of reporting the whole pass green.
 */
const FORCED_COLORS_TARGETS = [
  { selector: '.VPNavBarMenu .VPNavBarMenuLink', what: 'header workspace CTA (accent fill)' },
  {
    selector: '.VPSidebarItem.is-active > .item > .link .text',
    what: 'sidebar current page (control: never filled)',
  },
]

/**
 * Which sampled labels read as lost to the backplate.
 *
 * Split out from the browser work so the self-test can exercise the decision without one — the
 * same reason every other decision in this file is a pure function.
 */
export const lostLabels = (samples, floor = READABLE_LABEL_COLOUR_FLOOR) =>
  samples.filter(({ colours }) => colours < floor)

/**
 * Distinct RGBA colours in an element's own text crop, read back from composited pixels.
 *
 * The only helper in this file that needs a browser, which is why `lostLabels` above is separate:
 * the decision is testable in the fast loop and the capture is not. `Locator.screenshot()` goes
 * into a same-page `<canvas>` via `drawImage`/`getImageData`, so what gets counted is what was
 * actually painted rather than any DOM property.
 *
 * Two details are load-bearing rather than cosmetic, both learned the hard way in the site
 * repository and re-checked here:
 *
 *  - **`scale: 'css'`.** `Range.getBoundingClientRect()` is in CSS pixels and a locator screenshot
 *    defaults to device pixels. Any deviceScaleFactor above 1 then crops to the label's top-left
 *    corner and reads a flat fill on a control that is perfectly fine.
 *  - **Crop to the text, not to the box.** The control this exists for pairs its label with a
 *    `currentColor` mask icon in the same element. An icon is not text, the backplate never reaches
 *    it, and it kept rendering while the label was gone — so a whole-button sample cannot tell "the
 *    label survived" from "only the arrow did".
 *
 * A degenerate crop throws instead of returning a number: a zero-width text node — VitePress's
 * `.header-anchor` is one, it holds a zero-width space — would otherwise read as one flat colour
 * and be reported as a broken label that is not there.
 */
const countLabelColours = async (page, locator) => {
  const screenshot = await locator.screenshot({ scale: 'css' })
  const source = `data:image/png;base64,${screenshot.toString('base64')}`

  const crop = await locator.evaluate((element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        (node.textContent ?? '').trim().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    })
    const textNode = walker.nextNode()
    if (textNode === null) throw new Error('has no non-whitespace text node to crop to')

    const range = document.createRange()
    range.selectNodeContents(textNode)
    const textBox = range.getBoundingClientRect()
    const elementBox = element.getBoundingClientRect()
    const styles = getComputedStyle(element)

    // Relative to the element's own top-left, which is where the screenshot's pixel grid starts.
    return {
      x: textBox.left - elementBox.left,
      y: textBox.top - elementBox.top,
      width: textBox.width,
      height: textBox.height,
      text: (textNode.textContent ?? '').trim().slice(0, 40),
      background: styles.backgroundColor,
      colour: styles.color,
    }
  })

  if (crop.width < 4 || crop.height < 4) {
    throw new Error(`text crop is ${Math.round(crop.width)}x${Math.round(crop.height)}px, too small to measure`)
  }

  const colours = await page.evaluate(
    async ({ src, box }) => {
      const image = new Image()
      await new Promise((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('failed to decode element screenshot'))
        image.src = src
      })

      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')
      if (context === null) throw new Error('2d canvas context is unavailable')
      context.drawImage(image, 0, 0)

      // Clamped to the decoded image: a mismatch between the CSS rect and the screenshot's own
      // pixel grid must shrink the crop rather than read past the buffer.
      const x = Math.max(0, Math.round(box.x))
      const y = Math.max(0, Math.round(box.y))
      const width = Math.max(1, Math.min(Math.round(box.width), canvas.width - x))
      const height = Math.max(1, Math.min(Math.round(box.height), canvas.height - y))

      const { data } = context.getImageData(x, y, width, height)
      const seen = new Set()
      for (let i = 0; i < data.length; i += 4) {
        seen.add(`${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`)
      }
      return seen.size
    },
    { src: source, box: crop },
  )

  return { colours, text: crop.text, background: crop.background, colour: crop.colour }
}

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

const resolveFile = (dist, urlPath) =>
  candidatePaths(urlPath)
    .map((candidate) => join(dist, candidate))
    .find((candidate) => existsSync(candidate) && statSync(candidate).isFile())

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

const navigationsAtDepth = (depth) => THEMES.reduce((sum, theme) => sum + depth.widths[theme].length, 0)

/**
 * How many browser navigations a run performs, by arithmetic over the selection.
 *
 * Deliberately a second derivation next to `planTasks`, which enumerates them: the run refuses to
 * start when the two disagree, and fails when the number of navigations that actually COMPLETED
 * differs from this. Counted rather than inferred, because an old success line reported 80 while
 * the script did 81 — the reduced-motion pass was never added to the tally.
 */
export const plannedNavigations = ({ pages, withReducedMotion, withForcedColors }) =>
  pages.reduce((sum, page) => sum + navigationsAtDepth(page.depth), 0) +
  (withReducedMotion ? 1 : 0) +
  (withForcedColors ? FORCED_COLORS_THEMES.length : 0)

/**
 * The run, as an ordered list of navigations. The order is page, then theme, then width, then the
 * fixed passes — and it is the order findings print in, whatever order the pool finishes them.
 */
export const planTasks = ({ pages, withReducedMotion, withForcedColors }) => {
  const tasks = []
  for (const { url, label, depth } of pages) {
    for (const theme of THEMES) {
      for (const width of depth.widths[theme]) {
        tasks.push({ kind: 'layout', url, label, theme, width, axe: AXE_WIDTHS.has(width) })
      }
    }
  }
  if (withReducedMotion) tasks.push({ kind: 'reduced-motion', url: REDUCED_MOTION_URL })
  if (withForcedColors) {
    for (const theme of FORCED_COLORS_THEMES) {
      tasks.push({ kind: 'forced-colors', url: FORCED_COLORS_URL, theme, width: FORCED_COLORS_WIDTH })
    }
  }
  return tasks
}

/** Four real navigations of the root page, none of them running axe: enough to be mid-run. */
export const planProbeTasks = () =>
  [480, 768, 1024, 1280].map((width) => ({
    kind: 'layout',
    url: '/',
    label: 'teardown probe',
    theme: 'dark',
    width,
    axe: false,
  }))

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
export const parseSelection = (argv, gatePages, allPageUrls = ALL_PAGE_URLS) => {
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

  const labelled = new Map(gatePages.map(({ url, label }) => [url, label]))
  const full = {
    mode: 'gate',
    // Every URL pages.ts produces, in its order: the layout types at full depth, the rest swept.
    pages: allPageUrls.map((url) =>
      labelled.has(url)
        ? { url, label: labelled.get(url), depth: FULL_DEPTH }
        : { url, label: SWEPT_LABEL, depth: SWEEP_DEPTH },
    ),
    withReducedMotion: true,
    withForcedColors: true,
    escalations,
  }
  if (!sawSelector || argv.includes(ALL_FLAG)) return full
  if (escalations.length) return { ...full, mode: 'escalated' }
  if (wanted.length === 0) return full

  return {
    mode: 'targeted',
    pages: wanted.map((url) => ({ url, label: labelled.get(url) ?? 'targeted page', depth: FULL_DEPTH })),
    withReducedMotion: false,
    withForcedColors: false,
    escalations,
  }
}

/** `--concurrency <n>`: how many navigations run at once. Absent means the measured default. */
export const parseConcurrency = (argv) => {
  const at = argv.indexOf(CONCURRENCY_FLAG)
  if (at === -1) return DEFAULT_CONCURRENCY
  const raw = argv[at + 1]
  const value = Number(raw)
  if (raw === undefined || !/^\d+$/.test(raw) || value < 1 || value > MAX_CONCURRENCY) {
    throw new Error(`${CONCURRENCY_FLAG} needs a whole number from 1 to ${MAX_CONCURRENCY}, got ${raw ?? 'nothing'}`)
  }
  return value
}

const describeDepth = ({ widths }) => THEMES.map((theme) => `${theme} ${widths[theme].join('/')}`).join(', ')

/** The lines a run prints about what it did NOT do. Never empty. */
export const notCoveredLines = (selection, { gatePages, allPageUrls }) => {
  const rendered = new Set(selection.pages.map((page) => page.url))
  const uncovered = allPageUrls.filter((url) => !rendered.has(url))
  const swept = selection.pages.filter((page) => page.depth === SWEEP_DEPTH)
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
    lines.push(
      'NOT covered by a targeted run: the forced-colors pass — also a fixed extra pass on ' +
        `${FORCED_COLORS_URL}, and the only check here that reads decoded pixels rather than ` +
        'computed style. A theme change is not a page change, so it escalates to the gate anyway.',
    )
  }
  if (selection.mode === 'escalated') {
    lines.push(
      `escalated to the full gate: ${selection.escalations.join(', ')} ` +
        'is not page markdown, so its effect is not localised to one URL.',
    )
  }
  if (swept.length) {
    const skippedDark = FULL_DEPTH.widths.dark.filter((width) => !SWEEP_DEPTH.widths.dark.includes(width))
    lines.push(
      `NOT at full depth: ${swept.length} of the ${allPageUrls.length} page URLs are swept at ` +
        `${describeDepth(SWEEP_DEPTH)} — never at dark ${skippedDark.join('/')}. Full depth is kept ` +
        `for the ${selection.pages.length - swept.length} layout types; DEPLOY.md records the matrix.`,
    )
  }
  if (uncovered.length) {
    lines.push(
      `NOT covered: ${uncovered.length} of the ${allPageUrls.length} page URLs this site serves. ` +
        'Only the gate renders all of them — DEPLOY.md records the gap.',
    )
  }
  return lines
}

/**
 * Runs `work` over `items` with at most `concurrency` in flight, and resolves with the results in
 * ITEM order — never completion order, which is what keeps the printed findings deterministic.
 *
 * On the first rejection it stops handing out work and rejects at once with that error, without
 * waiting for tasks already running: those may be blocked on a browser that only the caller can
 * close. `inFlight` is the caller's view of them, so it can close the browser and then wait for them
 * to settle before tearing the server down. Every task's rejection is handled here, so a task that
 * fails after the pool has already rejected is never an unhandled rejection.
 */
export const runPool = (items, concurrency, work, inFlight = new Set()) =>
  new Promise((resolvePool, rejectPool) => {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      rejectPool(new Error(`concurrency must be a positive integer, got ${concurrency}`))
      return
    }
    const results = new Array(items.length)
    let next = 0
    let settled = 0
    let failed = false

    const schedule = () => {
      if (failed) return
      if (settled === items.length) {
        resolvePool(results)
        return
      }
      while (inFlight.size < concurrency && next < items.length) {
        const index = next++
        const running = Promise.resolve().then(() => work(items[index], index))
        inFlight.add(running)
        running.then(
          (value) => {
            inFlight.delete(running)
            results[index] = value
            settled++
            schedule()
          },
          (error) => {
            inFlight.delete(running)
            if (failed) return
            failed = true
            rejectPool(error)
          },
        )
      }
    }
    schedule()
  })

/** Resolves `true` when `promise` settles within `ms`, `false` when it does not. Never rejects. */
const settlesWithin = (promise, ms) =>
  new Promise((done) => {
    const timer = setTimeout(() => done(false), ms)
    promise.then(
      () => { clearTimeout(timer); done(true) },
      () => { clearTimeout(timer); done(true) },
    )
  })

/**
 * What a finished teardown probe says about the gate, as a list of problems. Empty means the gate,
 * failing mid-run with a browser and a server up, ended by itself for the reason it was given.
 */
export const teardownProblems = ({ timedOut, code, signal, stderr }, deadlineMs = TEARDOWN_DEADLINE_MS) => {
  if (timedOut) {
    return [
      `still running ${deadlineMs / 1000} s after a failure was injected mid-run, so it was killed: ` +
        'a throw with the browser and the server up leaves something alive, and the real gate ' +
        'would hang in CI instead of failing',
    ]
  }
  const problems = []
  if (signal) problems.push(`ended by ${signal} rather than exiting on its own`)
  else if (code === 0) problems.push('exited 0 after an injected failure: a broken run would be reported green')
  if (!stderr.includes(TEARDOWN_PROBE_MARKER)) {
    const firstLine = stderr.trim().split('\n')[0] || 'nothing on stderr'
    problems.push(`did not fail for the injected reason, so the probe proved nothing — it said: ${firstLine}`)
  }
  return problems
}

/** How the CLI entry reports a fatal error, shared with the probe so both leave by the same path. */
export const reportFatal = (error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}

const where = (task) => {
  if (task.kind === 'reduced-motion') return 'prefers-reduced-motion: reduce'
  if (task.kind === 'forced-colors') {
    return `forced-colors: active, ${task.theme} theme, ${task.width}px ${task.url}`
  }
  return `${task.theme} ${task.width}px ${task.url}  (${task.label})`
}

const themeInitScript = (theme) =>
  `try { localStorage.setItem('vitepress-theme-appearance', '${theme}') } catch {}`

/**
 * One page at one width in one theme: sideways scroll, touch targets below the drawer breakpoint,
 * axe at the extremes, and console health — in that order, on one navigation, as before
 * parallelisation. The order is load-bearing: the touch pass opens the drawer, and axe at 390 reads
 * the page with the drawer's contents rendered.
 */
const runLayoutTask = async (task, { browser, base, axeSource }) => {
  const { url, theme, width } = task
  const findings = []
  const fail = (message) => findings.push(message)

  const context = await browser.newContext({ colorScheme: theme })
  try {
    // Stamp the preference before first paint so nothing is measured mid
    // transition — VitePress cross-fades colours over 0.5s.
    await context.addInitScript(themeInitScript(theme))
    const page = await context.newPage()

    const consoleProblems = []
    page.on('pageerror', (e) => consoleProblems.push(`page error: ${String(e).slice(0, 160)}`))
    page.on('console', (m) => {
      if (m.type() === 'error') consoleProblems.push(`console error: ${m.text().slice(0, 160)}`)
    })
    page.on('requestfailed', (r) => consoleProblems.push(`request failed: ${r.url().slice(0, 160)}`))

    await page.setViewportSize({ width, height: 900 })
    await page.goto(`${base}${url}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(120)

    const applied = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    if (applied !== (theme === 'dark')) {
      fail(`theme not applied before measuring (html.dark=${applied})`)
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    if (overflow > 0) {
      const culprits = await page.evaluate((vw) =>
        [...document.querySelectorAll('body *')]
          .filter((el) => el.getBoundingClientRect().right > vw + 1)
          .slice(0, 3)
          .map((el) => {
            const cls = (el.className || '').toString().trim().split(/\s+/).slice(0, 2).join('.')
            return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`
          }), width)
      fail(`page scrolls sideways by ${overflow}px — widest: ${culprits.join(', ') || 'unknown'}`)
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
        fail(`${small.length} touch target(s) under ${MIN_TOUCH_TARGET}px: ${shown}`)
      }
      await page.keyboard.press('Escape').catch(() => {})
    }

    if (task.axe) {
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
        fail(`axe ${v.id} [${v.impact}] x${v.n} — ${v.target}`)
      }
    }

    for (const problem of consoleProblems) fail(problem)
    return { findings, navigations: 1 }
  } finally {
    await context.close().catch(() => {})
  }
}

/**
 * VitePress already suppresses transitions under reduced motion, and base.css repeats the blanket,
 * so the baseline is covered twice over. What this catches is the regression that actually shipped
 * in the GitBook era: an author rule carrying `!important` outranks the blanket, and the sidebar
 * keeps animating for someone who asked it not to. Verified by adding exactly such a rule.
 *
 * It is a fixed extra pass on one URL, not a per-page check, which is exactly why a targeted run
 * cannot include it and has to declare that it did not.
 */
const runReducedMotionTask = async (task, { browser, base }) => {
  const findings = []
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  try {
    const page = await context.newPage()
    await page.goto(`${base}${task.url}`, { waitUntil: 'networkidle' })
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
    if (animated.length) findings.push(`still animating: ${animated.join('; ')}`)
    return { findings, navigations: 1 }
  } finally {
    await context.close().catch(() => {})
  }
}

/**
 * Forced colours, read as pixels. Every other check in this file asks the DOM a question, and this
 * is the one defect class the DOM answers wrongly: Chromium paints an opaque `Canvas`-coloured
 * backplate behind text in this mode, so a control whose own text resolves to `Canvas` loses its
 * label while `background` and `color` still compute to two different, individually fine-looking
 * values. The fix in `theme/tokens.css` was found this way and cannot be protected any other way —
 * see FORCED_COLORS_TARGETS.
 *
 * Two fixed extra passes on one URL, one per theme, so a targeted run cannot include them and has
 * to declare that it did not.
 */
const runForcedColorsTask = async (task, { browser, base }) => {
  const { theme, width, url } = task
  const findings = []
  const fail = (message) => findings.push(message)

  const context = await browser.newContext({ colorScheme: theme, forcedColors: 'active' })
  try {
    await context.addInitScript(themeInitScript(theme))
    const page = await context.newPage()
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`${base}${url}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(200)
    // A cold context per task loads its fonts afresh; the glyphs have to be the real ones before
    // anything counts their colours.
    await page.evaluate(() => document.fonts.ready.then(() => undefined))

    // The emulation and the palette, asserted rather than assumed. A run that measured an
    // un-emulated raster would report every label legible and prove nothing, and that is a
    // failure mode this check hit while it was being written.
    const mode = await page.evaluate(() => {
      const probe = document.createElement('div')
      probe.style.cssText = 'position:fixed;left:-9999px;background:Canvas;color:CanvasText'
      document.body.appendChild(probe)
      const styles = getComputedStyle(probe)
      const seen = {
        active: matchMedia('(forced-colors: active)').matches,
        dark: document.documentElement.classList.contains('dark'),
        canvas: styles.backgroundColor,
        canvasText: styles.color,
      }
      probe.remove()
      return seen
    })
    if (!mode.active) {
      fail('forced-colors emulation is not active, so nothing below measures the mode')
    }
    if (mode.dark !== (theme === 'dark')) {
      fail(`theme not applied before measuring (html.dark=${mode.dark})`)
    }
    if (mode.canvas === mode.canvasText) {
      fail(`Canvas and CanvasText both resolved to ${mode.canvas} — no palette to measure against`)
    }

    const samples = []
    for (const { selector, what } of FORCED_COLORS_TARGETS) {
      const locator = page.locator(selector).first()
      // A selector that stopped matching must fail rather than shrink the pass silently — the
      // same reasoning as assertGatePagesExist.
      if ((await locator.count()) === 0 || !(await locator.isVisible().catch(() => false))) {
        fail(`${what} — ${selector} matched nothing visible, so it was NOT measured`)
        continue
      }
      try {
        samples.push({ what, selector, ...(await countLabelColours(page, locator)) })
      } catch (error) {
        fail(`${what} — ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    for (const lost of lostLabels(samples)) {
      fail(
        `${lost.what} label "${lost.text}" is invisible: ${lost.colours} distinct colour(s) in ` +
          `its own text crop, floor is ${READABLE_LABEL_COLOUR_FLOOR}. Computed style says ` +
          `background ${lost.background} on colour ${lost.colour}, which is the lie this check ` +
          'exists to catch — the glyphs are painted onto a backplate of their own colour.',
      )
    }
    return { findings, navigations: 1, samples }
  } finally {
    await context.close().catch(() => {})
  }
}

const TASK_RUNNERS = {
  layout: runLayoutTask,
  'reduced-motion': runReducedMotionTask,
  'forced-colors': runForcedColorsTask,
}

/**
 * One navigation and every assertion on it. An error — a navigation timeout, a closed browser — is
 * rethrown with the task it happened in, because "Timeout 30000ms exceeded" alone does not say
 * which of two hundred navigations to look at.
 */
export const runTask = async (task, env) => {
  const runner = TASK_RUNNERS[task.kind]
  if (!runner) throw new Error(`no runner for a ${task.kind} task`)
  try {
    return await runner(task, env)
  } catch (error) {
    throw new Error(`${where(task)}: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
}

const loadAxeSource = () => {
  const axePath = findAxe()
  if (!axePath) {
    throw new Error(
      'axe-core is not installed, so the accessibility pass cannot run.\n' +
        'Run `npm ci`. Refusing to report a pass without it.',
    )
  }
  return readFileSync(axePath, 'utf8')
}

const loadChromium = async () => {
  try {
    return (await import('playwright')).chromium
  } catch {
    throw new Error('playwright is not installed. Run `npm ci`.')
  }
}

/**
 * An honoured `PLAYWRIGHT_CHROMIUM_PATH` comes back as the only candidate, so this loop can no
 * longer walk past the binary the operator named: a bad path throws before the loop is entered,
 * and a good one that fails to launch is reported rather than substituted. With no override set
 * the fall-through below is unchanged, because there it is a convenience with nothing to
 * contradict.
 */
const launchBrowser = async (chromium) => {
  let lastError
  for (const options of launchCandidates(process.env.PLAYWRIGHT_CHROMIUM_PATH)) {
    try {
      return { browser: await chromium.launch(options), chosen: options }
    } catch (error) {
      lastError = error
    }
  }
  throw new Error(
    'Could not launch Chromium for the layout check.\n' +
      `  ${String(lastError).split('\n')[0]}\n` +
      '  Install it with `npx playwright install chromium`, or set\n' +
      '  PLAYWRIGHT_CHROMIUM_PATH to a Chromium binary.',
  )
}

/** The one static server every task shares. It only reads, so sharing it cannot couple tasks. */
const startServer = (dist) =>
  new Promise((ready, refuse) => {
    const server = createServer(async (req, res) => {
      const file = resolveFile(dist, req.url)
      if (!file) {
        res.writeHead(404).end('not found')
        return
      }
      try {
        const body = await readFile(file)
        res.writeHead(200, {
          'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
          'Content-Length': body.length,
        })
        res.end(body)
      } catch {
        // Answered rather than thrown: the page logs a failed resource, which is a finding, and the
        // server keeps serving everyone else.
        if (!res.headersSent) res.writeHead(500)
        res.end('read failed')
      }
    })
    server.once('error', refuse)
    server.listen(0, '127.0.0.1', () => ready(server))
  })

const stopServer = (server) =>
  new Promise((stopped) => {
    server.close(() => stopped())
    // Keep-alive sockets would otherwise hold `close` open, and with it the process.
    server.closeAllConnections()
  })

/**
 * The browser half of the gate: one server, one Chromium, the tasks through a bounded pool.
 * Resolves with each task's result in plan order and the number of navigations that completed.
 *
 * Everything here holds two things that keep the event loop alive: a listening socket and a
 * Chromium. Teardown therefore belongs in `finally` and not on the happy path — a throw halfway
 * through the run used to leave both alive, and `main().catch()` would set process.exitCode on a
 * process that then never exited. A hung gate is worse than a failed one: CI waits for its timeout
 * and a person reads a live terminal as work still in progress. The teardown probe at the start of
 * every real run proves this path, in a child process, against the real dist/.
 *
 * `work` is the per-task function, a parameter only so the probe can inject a failure into a real
 * run; the gate always passes `runTask`.
 */
export async function runLayoutGate({ tasks, concurrency, work = runTask, dist = DIST, onLaunch = () => {} }) {
  const axeSource = loadAxeSource()
  const chromium = await loadChromium()
  const server = await startServer(dist)
  const inFlight = new Set()
  let browser

  try {
    const launched = await launchBrowser(chromium)
    browser = launched.browser
    onLaunch(launched.chosen)
    const env = { browser, base: `http://127.0.0.1:${server.address().port}`, axeSource }
    const results = await runPool(tasks, concurrency, (task) => work(task, env), inFlight)
    const completed = results.reduce((sum, result) => sum + (result?.navigations ?? 0), 0)
    return { results, completed }
  } finally {
    // Browser first: closing it is what makes every in-flight Playwright call reject, so the tasks
    // still running after a failure settle promptly instead of waiting out a navigation timeout.
    // Both waits are bounded and neither may replace the original error — an already-dead browser
    // rejects here, and that rejection would otherwise be the only thing anyone saw.
    if (browser) await settlesWithin(browser.close(), BROWSER_CLOSE_TIMEOUT_MS)
    await settlesWithin(Promise.allSettled([...inFlight]), IN_FLIGHT_SETTLE_TIMEOUT_MS)
    await stopServer(server)
  }
}

/**
 * The code the probe child runs. It leaves by `reportFatal` — `process.exitCode`, not an uncaught
 * exception — because an uncaught exception ends a process whatever it still holds, and would hide
 * the very hang this exists to catch. It imports the runner rather than invoking the CLI, so the
 * probe cannot start another probe.
 */
const probeSource = (moduleUrl) => `
import { runLayoutGate, runTask, planProbeTasks, reportFatal, TEARDOWN_PROBE_MARKER } from ${JSON.stringify(moduleUrl)}
let finished = 0
runLayoutGate({
  tasks: planProbeTasks(),
  concurrency: ${PROBE_CONCURRENCY},
  work: async (task, env) => {
    const result = await runTask(task, env)
    finished += 1
    if (finished === ${PROBE_FAIL_AFTER}) throw new Error(TEARDOWN_PROBE_MARKER)
    return result
  },
}).then(() => reportFatal(new Error('the injected failure never fired')), reportFatal)
`

/**
 * Runs the probe and returns `teardownProblems` for it. The child gets its own process group so a
 * hung one is killed together with its Chromium, and the verdict waits for `close` — every stdio
 * stream shut — rather than the first sign of the marker.
 */
const proveTeardown = () =>
  new Promise((done) => {
    const child = spawn(
      process.execPath,
      ['--experimental-strip-types', '--input-type=module', '-e', probeSource(import.meta.url)],
      { cwd: REPO_ROOT, detached: true, stdio: ['ignore', 'ignore', 'pipe'] },
    )
    let stderr = ''
    let timedOut = false
    child.stderr.on('data', (chunk) => { stderr += chunk })
    const timer = setTimeout(() => {
      timedOut = true
      try {
        process.kill(-child.pid, 'SIGKILL')
      } catch {
        child.kill('SIGKILL')
      }
    }, TEARDOWN_DEADLINE_MS)
    child.once('error', (error) => {
      clearTimeout(timer)
      done([`could not start: ${error.message}`])
    })
    child.once('close', (code, signal) => {
      clearTimeout(timer)
      done(teardownProblems({ timedOut, code, signal, stderr }))
    })
  })

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

async function expectRejection(promise, expectedFragment, description) {
  try {
    await promise
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes(expectedFragment)) {
      throw new Error(`Layout check self-test failed: ${description} reported ${JSON.stringify(message)}`)
    }
    return
  }
  throw new Error(`Layout check self-test failed: ${description} was accepted`)
}

/** A promise the self-test resolves by hand, so the pool's scheduling is observable without timers. */
const deferred = () => {
  let resolveIt
  let rejectIt
  const promise = new Promise((resolveFn, rejectFn) => {
    resolveIt = resolveFn
    rejectIt = rejectFn
  })
  return { promise, resolve: resolveIt, reject: rejectIt }
}

/** Lets every queued promise callback run. */
const drainMicrotasks = () => new Promise((settle) => setImmediate(settle))

/**
 * The pool's contract, proved with hand-resolved promises rather than a browser: bounded, ordered by
 * item, counted by completion, and stopped — promptly — by the first failure.
 */
async function selfTestPool() {
  const gates = [0, 1, 2, 3, 4].map(() => deferred())
  const started = []
  let active = 0
  let peak = 0
  const pool = runPool([0, 1, 2, 3, 4], 2, async (item) => {
    started.push(item)
    active++
    peak = Math.max(peak, active)
    const value = await gates[item].promise
    active--
    return value
  })
  await drainMicrotasks()
  if (started.join() !== '0,1') {
    throw new Error(`Layout check self-test failed: a pool of two started ${started.join()} at once`)
  }
  // Finish out of order; the results must still come back in item order.
  gates[1].resolve('b')
  await drainMicrotasks()
  gates[0].resolve('a')
  await drainMicrotasks()
  gates[3].resolve('d')
  gates[2].resolve('c')
  await drainMicrotasks()
  gates[4].resolve('e')
  const ordered = await pool
  if (ordered.join() !== 'a,b,c,d,e') {
    throw new Error(`Layout check self-test failed: the pool returned ${ordered.join()} — completion order leaked`)
  }
  if (peak !== 2) {
    throw new Error(`Layout check self-test failed: a pool of two ran ${peak} tasks at once`)
  }

  // The first failure stops the pool at once, even with a task still running that never finishes,
  // and nothing further is started.
  const stuck = deferred()
  const touched = []
  const inFlight = new Set()
  const failing = runPool([0, 1, 2, 3], 2, async (item) => {
    touched.push(item)
    if (item === 0) return stuck.promise
    throw new Error('task 1 broke')
  }, inFlight)
  await expectRejection(failing, 'task 1 broke', 'a pool whose task failed')
  await drainMicrotasks()
  if (touched.join() !== '0,1') {
    throw new Error(`Layout check self-test failed: work started after a failure — ${touched.join()}`)
  }
  if (inFlight.size !== 1) {
    throw new Error('Layout check self-test failed: the still-running task is not visible for teardown')
  }
  // A task that fails after the pool has already rejected is handled, not an unhandled rejection.
  stuck.reject(new Error('browser closed under a running task'))
  await drainMicrotasks()
  if (inFlight.size !== 0) {
    throw new Error('Layout check self-test failed: a settled task stayed in flight')
  }

  if ((await runPool([], 3, async () => 'x')).length !== 0) {
    throw new Error('Layout check self-test failed: an empty plan did not resolve empty')
  }
  await expectRejection(runPool([1], 0, async () => 1), 'concurrency must be a positive integer', 'a pool of zero')
}

/**
 * Pure by construction: this gate needs a build and a browser, and neither
 * belongs in a one-second loop. So the self-test exercises the decisions —
 * URL resolution order, page selection, the plan and its tally, the pool, the
 * teardown verdict, and the lines about what was skipped — and never opens a
 * page. The browser half of the teardown guarantee is the probe every real run
 * starts with.
 */
async function runSelfTest() {
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

  // The browser choice, proved here rather than borrowed from the card renderer's self-test: this
  // gate measures, so it is this gate that must refuse to measure on a browser nobody asked for.
  // The case that matters is the middle one — it used to fall through to another binary and pass.
  const overridden = launchCandidates('/opt/my-chromium', () => true)
  if (overridden.length !== 1 || overridden[0].executablePath !== '/opt/my-chromium') {
    throw new Error(
      `Layout check self-test failed: an existing override resolved to ${JSON.stringify(overridden)}`,
    )
  }
  expectFailure(
    () => launchCandidates('/opt/gone', () => false),
    'PLAYWRIGHT_CHROMIUM_PATH points at /opt/gone, which does not exist',
    'an override naming a binary that is not there',
  )
  const fallbacks = launchCandidates(undefined, (path) => path === '/usr/bin/chromium')
  if (Object.keys(fallbacks[0] ?? {}).length !== 0) {
    throw new Error("Layout check self-test failed: Playwright's own browser is no longer tried first")
  }
  if (fallbacks.length !== 2 || fallbacks[1].executablePath !== '/usr/bin/chromium') {
    throw new Error(
      `Layout check self-test failed: system fallbacks resolved to ${JSON.stringify(fallbacks)}`,
    )
  }

  // The depths themselves. Full depth is the matrix the ten layout types always had, and a sweep
  // that lost a theme, an extreme or its axe passes would still "cover every page".
  if (navigationsAtDepth(FULL_DEPTH) !== 8 || FULL_DEPTH.widths.light.join() !== '390,1440') {
    throw new Error(`Layout check self-test failed: full depth is ${describeDepth(FULL_DEPTH)}, not 6 dark + 2 light`)
  }
  for (const theme of THEMES) {
    const widths = SWEEP_DEPTH.widths[theme]
    if (!widths.includes(Math.min(...WIDTHS)) || !widths.includes(Math.max(...WIDTHS))) {
      throw new Error(`Layout check self-test failed: the sweep lost an extreme width in ${theme}`)
    }
    if (widths.some((width) => !WIDTHS.includes(width))) {
      throw new Error(`Layout check self-test failed: the sweep renders a ${theme} width the matrix does not know`)
    }
  }

  const gate = parseSelection([], GATE_PAGES)
  if (gate.mode !== 'gate' || !gate.withReducedMotion) {
    throw new Error(`Layout check self-test failed: a bare run selected ${JSON.stringify(gate.mode)}`)
  }
  if (!gate.withForcedColors) {
    throw new Error('Layout check self-test failed: the gate does not run the forced-colors pass')
  }
  // The gate renders every URL pages.ts produces, each once, and the ten layout types at full depth.
  if (gate.pages.map((p) => p.url).join() !== ALL_PAGE_URLS.join()) {
    throw new Error('Layout check self-test failed: the gate does not render exactly the URLs pages.ts produces')
  }
  const fullOnGate = gate.pages.filter((p) => p.depth === FULL_DEPTH).map((p) => p.url)
  if (fullOnGate.length !== GATE_PAGES.length || GATE_PAGES.some(({ url }) => !fullOnGate.includes(url))) {
    throw new Error('Layout check self-test failed: a layout type lost its full depth on the gate')
  }
  if (parseSelection([ALL_FLAG], GATE_PAGES).pages.length !== ALL_PAGE_URLS.length) {
    throw new Error('Layout check self-test failed: --all is not the full gate')
  }

  // The real tally: 10 layout types x (6 dark + 2 light), every other URL x (3 dark + 2 light),
  // 1 reduced-motion pass and 2 forced-colours passes. The arithmetic and the enumeration are two
  // derivations of one number, and the run refuses to start when they disagree.
  const expectedGate = 10 * 8 + (ALL_PAGE_URLS.length - 10) * 5 + 3
  const gatePlan = planTasks(gate)
  if (plannedNavigations(gate) !== expectedGate || gatePlan.length !== expectedGate) {
    throw new Error(
      `Layout check self-test failed: the gate plans ${gatePlan.length} navigations ` +
        `(arithmetic says ${plannedNavigations(gate)}), expected ${expectedGate}`,
    )
  }
  // axe at least once per theme on every page, swept or not.
  for (const url of ALL_PAGE_URLS) {
    for (const theme of THEMES) {
      if (!gatePlan.some((task) => task.url === url && task.theme === theme && task.axe)) {
        throw new Error(`Layout check self-test failed: ${url} gets no axe pass in ${theme}`)
      }
    }
  }
  // Plan order is page, then theme, then width — the order findings print in.
  const firstPage = gatePlan.filter((task) => task.url === '/' && task.kind === 'layout')
  if (firstPage.map((task) => `${task.theme}${task.width}`).join() !== 'dark390,dark480,dark768,dark1024,dark1280,dark1440,light390,light1440') {
    throw new Error(`Layout check self-test failed: plan order is ${firstPage.map((t) => `${t.theme}${t.width}`)}`)
  }
  if (gatePlan.slice(-3).map((task) => task.kind).join() !== 'reduced-motion,forced-colors,forced-colors') {
    throw new Error('Layout check self-test failed: the fixed passes are not the last three navigations')
  }
  // The fixed passes have to be countable independently, or a forced-colours pass that stopped
  // running would be absorbed by the page arithmetic.
  if (plannedNavigations({ pages: [], withReducedMotion: true, withForcedColors: true }) !== 3) {
    throw new Error('Layout check self-test failed: the fixed passes are not three navigations')
  }

  const targeted = parseSelection([CHANGED_FLAG, 'docs/ru/glossary.md'], GATE_PAGES)
  if (targeted.mode !== 'targeted' || targeted.pages.length !== 1) {
    throw new Error(`Layout check self-test failed: --changed selected ${JSON.stringify(targeted.pages)}`)
  }
  if (targeted.pages[0].url !== '/ru/glossary/' || targeted.withReducedMotion) {
    throw new Error('Layout check self-test failed: a targeted run kept the reduced-motion pass')
  }
  if (targeted.withForcedColors) {
    throw new Error('Layout check self-test failed: a targeted run kept the forced-colors pass')
  }
  // Narrowing pages never narrows checks: a page the gate only sweeps gets full depth when named.
  if (planTasks(targeted).length !== 8 || plannedNavigations(targeted) !== 8) {
    throw new Error('Layout check self-test failed: one targeted page is not eight navigations')
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
  if (escalated.mode !== 'escalated' || escalated.pages.length !== ALL_PAGE_URLS.length || !escalated.withReducedMotion) {
    throw new Error('Layout check self-test failed: a theme change did not escalate to the full gate')
  }
  // tokens.css is where the forced-colours palette and its fixes live, so the one change most
  // likely to break that pass must be the change that runs it.
  if (!escalated.withForcedColors) {
    throw new Error('Layout check self-test failed: a tokens.css change did not run the forced-colors pass')
  }
  const mixed = parseSelection([CHANGED_FLAG, 'docs/ru/faq.md', 'docs/.vitepress/theme/base.css'], GATE_PAGES)
  if (mixed.mode !== 'escalated' || mixed.pages.length !== ALL_PAGE_URLS.length) {
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

  // How many at once. The value after the flag is not a page, so it must not read as one either.
  if (parseConcurrency([]) !== DEFAULT_CONCURRENCY || parseConcurrency([CONCURRENCY_FLAG, '1']) !== 1) {
    throw new Error('Layout check self-test failed: --concurrency did not parse')
  }
  if (parseSelection([CONCURRENCY_FLAG, '3'], GATE_PAGES).mode !== 'gate') {
    throw new Error('Layout check self-test failed: --concurrency alone narrowed the gate')
  }
  expectFailure(() => parseConcurrency([CONCURRENCY_FLAG, '0']), '--concurrency needs a whole number', 'zero workers')
  expectFailure(() => parseConcurrency([CONCURRENCY_FLAG, '2.5']), 'got 2.5', 'a fractional worker count')
  expectFailure(() => parseConcurrency([CONCURRENCY_FLAG, `${MAX_CONCURRENCY + 1}`]), 'from 1 to', 'too many workers')
  expectFailure(() => parseConcurrency([CONCURRENCY_FLAG]), 'got nothing', 'a --concurrency with no value')

  // What the gate says it did not do: nothing unrendered any more, but the sweep's missing widths.
  const gateLines = notCoveredLines(gate, { gatePages: GATE_PAGES, allPageUrls: ALL_PAGE_URLS })
  const sweptCount = ALL_PAGE_URLS.length - GATE_PAGES.length
  if (!gateLines.some((l) => l.includes(`NOT at full depth: ${sweptCount} of the ${ALL_PAGE_URLS.length} page URLs`) && l.includes('never at dark 480/768/1280'))) {
    throw new Error(`Layout check self-test failed: the gate did not name its sweep — ${gateLines.join(' / ')}`)
  }
  if (gateLines.some((l) => l.startsWith('NOT covered:'))) {
    throw new Error('Layout check self-test failed: the gate claims to leave a page URL unrendered')
  }
  const targetedLines = notCoveredLines(targeted, { gatePages: GATE_PAGES, allPageUrls: ALL_PAGE_URLS })
  if (!targetedLines.some((l) => l.includes('a targeted run is NOT the gate'))) {
    throw new Error('Layout check self-test failed: a targeted run did not disclaim itself')
  }
  if (!targetedLines.some((l) => l.includes(`NOT covered: ${ALL_PAGE_URLS.length - 1} of the ${ALL_PAGE_URLS.length} page URLs`))) {
    throw new Error('Layout check self-test failed: a targeted run did not count the pages it left out')
  }
  if (targetedLines.some((l) => l.includes('NOT at full depth'))) {
    throw new Error('Layout check self-test failed: a targeted page was reported at sweep depth')
  }
  if (!targetedLines.some((l) => l.includes('prefers-reduced-motion') && l.includes('Both themes ARE covered'))) {
    throw new Error('Layout check self-test failed: the skipped pass is not named exactly')
  }
  if (!targetedLines.some((l) => l.includes('forced-colors pass') && l.includes('decoded pixels'))) {
    throw new Error('Layout check self-test failed: the skipped forced-colors pass is not named exactly')
  }

  // The forced-colours verdict. The numbers are the ones measured on this repository's own header
  // CTA before and after the tokens.css fix — 3 while the label was lost, 241 once repaired — plus
  // the boundary, because a floor that is off by one is a floor nobody can reason about.
  const lost = lostLabels([
    { what: 'header CTA', colours: 3 },
    { what: 'sidebar label', colours: 330 },
  ])
  if (lost.length !== 1 || lost[0].what !== 'header CTA') {
    throw new Error(`Layout check self-test failed: the backplate verdict picked ${JSON.stringify(lost)}`)
  }
  if (lostLabels([{ what: 'repaired CTA', colours: 241 }]).length !== 0) {
    throw new Error('Layout check self-test failed: a repaired label still read as lost')
  }
  if (lostLabels([{ what: 'at the floor', colours: READABLE_LABEL_COLOUR_FLOOR }]).length !== 0) {
    throw new Error('Layout check self-test failed: exactly the floor counts as lost')
  }
  if (lostLabels([{ what: 'below the floor', colours: READABLE_LABEL_COLOUR_FLOOR - 1 }]).length !== 1) {
    throw new Error('Layout check self-test failed: one below the floor does not count as lost')
  }
  // A flat fill is the shape of this defect, and it must never be read as "nothing to measure".
  if (lostLabels([{ what: 'a single flat colour', colours: 1 }]).length !== 1) {
    throw new Error('Layout check self-test failed: a completely flat crop did not read as lost')
  }
  if (!targetedLines.some((l) => l.includes('0 of the 10 gate pages'))) {
    throw new Error('Layout check self-test failed: a page outside the gate list was counted as gate coverage')
  }
  if (gateLines.length === 0 || targetedLines.length === 0) {
    throw new Error('Layout check self-test failed: a run reported nothing about what it skipped')
  }

  await selfTestPool()

  // The teardown verdict: only "ended by itself, non-zero, for the injected reason" passes.
  const stderrWithMarker = `dark 480px /: ${TEARDOWN_PROBE_MARKER}\n`
  if (teardownProblems({ timedOut: false, code: 1, signal: null, stderr: stderrWithMarker }).length !== 0) {
    throw new Error('Layout check self-test failed: a clean teardown was reported as a problem')
  }
  const verdicts = [
    [{ timedOut: true, code: null, signal: 'SIGKILL', stderr: '' }, 'still running', 'a hung probe'],
    [{ timedOut: false, code: 0, signal: null, stderr: stderrWithMarker }, 'exited 0', 'a failure reported green'],
    [{ timedOut: false, code: 1, signal: null, stderr: 'Cannot find module playwright' }, 'injected reason', 'a failure for another reason'],
    [{ timedOut: false, code: null, signal: 'SIGSEGV', stderr: stderrWithMarker }, 'ended by SIGSEGV', 'a crash'],
  ]
  for (const [outcome, fragment, description] of verdicts) {
    expectFailure(
      () => {
        const problems = teardownProblems(outcome)
        if (problems.length) throw new Error(problems.join('; '))
      },
      fragment,
      description,
    )
  }

  console.log('Layout check self-test passed')
}

/** Findings in plan order — page, theme, width, then the fixed passes — whatever finished first. */
const collectFindings = (tasks, results) =>
  tasks.flatMap((task, index) => (results[index]?.findings ?? []).map((message) => `${where(task)}\n    ${message}`))

const summaryLine = (selection, navigations, concurrency) => {
  const full = selection.pages.filter((page) => page.depth === FULL_DEPTH).length
  const swept = selection.pages.length - full
  const depths = [
    full ? `${full} at full depth (${describeDepth(FULL_DEPTH)})` : null,
    swept ? `${swept} swept (${describeDepth(SWEEP_DEPTH)})` : null,
  ].filter(Boolean)
  const fixed = [
    selection.withReducedMotion ? 'one prefers-reduced-motion pass' : null,
    selection.withForcedColors ? `${FORCED_COLORS_THEMES.length} forced-colors passes` : null,
  ].filter(Boolean)
  return (
    `Layout check passed: ${navigations} navigation(s) over ${selection.pages.length} page(s), ` +
    `${concurrency} at a time — ${depths.join(', ')}; axe at ${[...AXE_WIDTHS].join(' and ')} in every ` +
    `theme rendered${fixed.length ? `, plus ${fixed.join(' and ')}` : ''}.`
  )
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.includes(SELF_TEST_FLAG)) {
    await runSelfTest()
    return
  }

  assertGatePagesExist(GATE_PAGES, ALL_PAGE_URLS)
  const selection = parseSelection(argv, GATE_PAGES)
  const concurrency = parseConcurrency(argv)
  const tasks = planTasks(selection)
  const planned = plannedNavigations(selection)
  if (tasks.length !== planned) {
    throw new Error(`the plan holds ${tasks.length} navigation(s) but the matrix calls for ${planned}; refusing to run`)
  }

  if (!existsSync(DIST)) {
    console.error(`No build output at ${DIST}. Run the build first.`)
    process.exitCode = 1
    return
  }

  // A targeted page that is not in dist would answer 404 and still be reported
  // as rendered. Catch it before the browser starts.
  const notBuilt = selection.pages.filter(({ url }) => !resolveFile(DIST, url))
  if (notBuilt.length) {
    console.error(`Not in dist: ${notBuilt.map((p) => p.url).join(', ')}`)
    console.error('Run the build first — a URL that 404s would otherwise pass every check.')
    process.exitCode = 1
    return
  }

  // Before trusting the run to end, prove that it ends: a failure injected mid-run, in a child
  // process, has to tear down its browser and server and exit non-zero by itself.
  const teardown = await proveTeardown()
  if (teardown.length) {
    console.error('Layout check FAILED before measuring anything: the teardown probe')
    for (const problem of teardown) console.error(`  ${problem}`)
    process.exitCode = 1
    return
  }
  console.log(
    `layout: teardown probe passed — a failure injected mid-run closed Chromium and the server and ` +
      `exited non-zero within ${TEARDOWN_DEADLINE_MS / 1000} s`,
  )

  /*
    Printed rather than inferred, for the same reason the card renderer prints it: everything
    below is a measurement — geometry at six widths, and a count of distinct painted colours that
    decides whether a label is legible — and glyph rasterisation differs between Chromium builds.
    This line is how the next person tells "I ran a different browser" from "the layout moved".
  */
  const { results, completed } = await runLayoutGate({
    tasks,
    concurrency,
    onLaunch: (chosen) =>
      console.log(`layout: measuring with ${chosen.executablePath ?? "Playwright's own pinned Chromium"}`),
  })

  const failures = collectFindings(tasks, results)
  // Counted from what completed, not from what started: a task that returned before its
  // navigation, or a pass that silently stopped running, shows up here.
  if (completed !== planned) {
    failures.push(`run accounting\n    completed ${completed} navigation(s) but planned ${planned}`)
  }

  if (failures.length) {
    console.error('Layout check FAILED:\n')
    for (const f of failures) console.error(`  ${f}\n`)
    console.error(`${failures.length} problem(s) across ${completed} navigation(s).`)
    process.exitCode = 1
    return
  }

  console.log(summaryLine(selection, completed, concurrency))
  console.log('  no sideways scroll, no small touch targets, no axe violations, no console errors.')
  if (selection.withForcedColors) {
    const measured = tasks
      .map((task, index) => ({ task, samples: results[index]?.samples }))
      .filter(({ samples }) => samples)
      .map(({ task, samples }) => `${task.theme}: ${samples.map((s) => `${s.what} ${s.colours}`).join(', ')}`)
    console.log(
      `  forced-colors: ${FORCED_COLORS_TARGETS.length} label(s) measured as pixels in ` +
        `${FORCED_COLORS_THEMES.join(' and ')}, none lost to the backplate (distinct colours — ${measured.join('; ')}).`,
    )
  }
  for (const line of notCoveredLines(selection, { gatePages: GATE_PAGES, allPageUrls: ALL_PAGE_URLS })) {
    console.log(`  ${line}`)
  }
}

/*
  Only when run as a script. This module exports `READABLE_LABEL_COLOUR_FLOOR`, `parseSelection` and
  the runner the teardown probe drives, so it is meant to be imported — and an unguarded `main()`
  meant that importing any of them started a server and a browser and ran the whole gate as a side
  effect. Same guard as `shoot-og-image.mjs`, where a bare import would have overwritten a committed
  file.
*/
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(reportFatal)
}
