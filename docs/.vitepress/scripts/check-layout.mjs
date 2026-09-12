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
export const plannedNavigations = (pageCount, widths, axeWidths, withReducedMotion, forcedColorsThemes = 0) => {
  const perPage = widths.length + widths.filter((w) => axeWidths.has(w)).length
  return pageCount * perPage + (withReducedMotion ? 1 : 0) + forcedColorsThemes
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
    withForcedColors: true,
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
    withForcedColors: false,
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

  // The real tally: 10 pages x (6 dark + 2 light) + 1 reduced-motion pass + 2 forced-colours
  // passes. Counted rather than inferred, because the accounting assertion at the end of a run is
  // the only thing that notices a pass which silently stopped happening.
  const full = plannedNavigations(GATE_PAGES.length, WIDTHS, AXE_WIDTHS, true, FORCED_COLORS_THEMES.length)
  if (full !== 83) {
    throw new Error(`Layout check self-test failed: the gate plans ${full} navigations, expected 83`)
  }
  if (plannedNavigations(1, WIDTHS, AXE_WIDTHS, false, 0) !== 8) {
    throw new Error('Layout check self-test failed: one targeted page is not eight navigations')
  }
  // The fixed passes have to be countable independently, or a forced-colours pass that stopped
  // running would be absorbed by the page arithmetic.
  if (plannedNavigations(0, WIDTHS, AXE_WIDTHS, true, FORCED_COLORS_THEMES.length) !== 3) {
    throw new Error('Layout check self-test failed: the fixed passes are not three navigations')
  }

  const gate = parseSelection([], GATE_PAGES)
  if (gate.mode !== 'gate' || gate.pages.length !== 10 || !gate.withReducedMotion) {
    throw new Error(`Layout check self-test failed: a bare run selected ${JSON.stringify(gate.mode)}`)
  }
  if (!gate.withForcedColors) {
    throw new Error('Layout check self-test failed: the gate does not run the forced-colors pass')
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
  if (targeted.withForcedColors) {
    throw new Error('Layout check self-test failed: a targeted run kept the forced-colors pass')
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
  // tokens.css is where the forced-colours palette and its fixes live, so the one change most
  // likely to break that pass must be the change that runs it.
  if (!escalated.withForcedColors) {
    throw new Error('Layout check self-test failed: a tokens.css change did not run the forced-colors pass')
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

    /*
      An honoured `PLAYWRIGHT_CHROMIUM_PATH` comes back as the only candidate, so this loop can no
      longer walk past the binary the operator named: a bad path throws before the loop is entered,
      and a good one that fails to launch is reported rather than substituted. With no override set
      the fall-through below is unchanged, because there it is a convenience with nothing to
      contradict.
    */
    let chosen
    let lastError
    for (const options of launchCandidates(process.env.PLAYWRIGHT_CHROMIUM_PATH)) {
      try {
        browser = await chromium.launch(options)
        chosen = options
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

    /*
      Printed rather than inferred, for the same reason the card renderer prints it: everything
      below is a measurement — geometry at six widths, and a count of distinct painted colours that
      decides whether a label is legible — and glyph rasterisation differs between Chromium builds.
      This line is how the next person tells "I ran a different browser" from "the layout moved".
    */
    console.log(
      `layout: measuring with ${
        chosen.executablePath ?? "Playwright's own pinned Chromium"
      }`,
    )

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

    // Forced colours, read as pixels. Every other check in this file asks the DOM a question, and
    // this is the one defect class the DOM answers wrongly: Chromium paints an opaque
    // `Canvas`-coloured backplate behind text in this mode, so a control whose own text resolves to
    // `Canvas` loses its label while `background` and `color` still compute to two different,
    // individually fine-looking values. The fix in `theme/tokens.css` was found this way and cannot
    // be protected any other way — see FORCED_COLORS_TARGETS.
    //
    // Two fixed extra passes on one URL, one per theme, so a targeted run cannot include them and
    // has to declare that it did not.
    if (selection.withForcedColors) {
      for (const theme of FORCED_COLORS_THEMES) {
        const context = await browser.newContext({ colorScheme: theme, forcedColors: 'active' })
        await context.addInitScript(
          `try { localStorage.setItem('vitepress-theme-appearance', '${theme}') } catch {}`,
        )
        const page = await context.newPage()
        await page.setViewportSize({ width: FORCED_COLORS_WIDTH, height: 900 })
        await page.goto(`${BASE}${FORCED_COLORS_URL}`, { waitUntil: 'networkidle' })
        await page.waitForTimeout(200)
        navigations++

        const where = `forced-colors: active, ${theme} theme, ${FORCED_COLORS_WIDTH}px ${FORCED_COLORS_URL}`

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
          fail(where, 'forced-colors emulation is not active, so nothing below measures the mode')
        }
        if (mode.dark !== (theme === 'dark')) {
          fail(where, `theme not applied before measuring (html.dark=${mode.dark})`)
        }
        if (mode.canvas === mode.canvasText) {
          fail(where, `Canvas and CanvasText both resolved to ${mode.canvas} — no palette to measure against`)
        }

        const samples = []
        for (const { selector, what } of FORCED_COLORS_TARGETS) {
          const locator = page.locator(selector).first()
          // A selector that stopped matching must fail rather than shrink the pass silently — the
          // same reasoning as assertGatePagesExist.
          if ((await locator.count()) === 0 || !(await locator.isVisible().catch(() => false))) {
            fail(where, `${what} — ${selector} matched nothing visible, so it was NOT measured`)
            continue
          }
          try {
            samples.push({ what, selector, ...(await countLabelColours(page, locator)) })
          } catch (error) {
            fail(where, `${what} — ${error instanceof Error ? error.message : String(error)}`)
          }
        }

        for (const lost of lostLabels(samples)) {
          fail(
            where,
            `${lost.what} label "${lost.text}" is invisible: ${lost.colours} distinct colour(s) in ` +
              `its own text crop, floor is ${READABLE_LABEL_COLOUR_FLOOR}. Computed style says ` +
              `background ${lost.background} on colour ${lost.colour}, which is the lie this check ` +
              'exists to catch — the glyphs are painted onto a backplate of their own colour.',
          )
        }

        await context.close()
      }
    }

    const planned = plannedNavigations(
      PAGES.length,
      WIDTHS,
      AXE_WIDTHS,
      selection.withReducedMotion,
      selection.withForcedColors ? FORCED_COLORS_THEMES.length : 0,
    )
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
        `${[...AXE_WIDTHS].join(' and ')}${selection.withReducedMotion ? ', plus one prefers-reduced-motion pass' : ''}` +
        `${selection.withForcedColors ? ` and ${FORCED_COLORS_THEMES.length} forced-colors passes` : ''}.`,
    )
    console.log('  no sideways scroll, no small touch targets, no axe violations, no console errors.')
    if (selection.withForcedColors) {
      console.log(
        `  forced-colors: ${FORCED_COLORS_TARGETS.length} label(s) measured as pixels in ` +
          `${FORCED_COLORS_THEMES.join(' and ')}, none lost to the backplate.`,
      )
    }
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

/*
  Only when run as a script. This module exports `READABLE_LABEL_COLOUR_FLOOR` and `parseSelection`,
  so it is meant to be imported — and an unguarded `main()` meant that importing either one started
  a preview server and a browser and ran the whole gate as a side effect. Same guard as
  `shoot-og-image.mjs`, where a bare import would have overwritten a committed file.
*/
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
