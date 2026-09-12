/**
 * Regenerates the social preview image (Open Graph / Twitter card).
 *
 * WHY THIS IS A POSTER AND NOT A SCREENSHOT. The previous image was the
 * product's own marketing frame: a mocked workspace panel with a six-step bar.
 * Two problems. It rendered its labels at 11-13px on a 1200px canvas, and a
 * feed shows that canvas around 400px wide, so every word except the wordmark
 * turned to mush. And the mock contradicted itself — step 1 "Donor Wallet"
 * highlighted while the panel below reported "Simulation PASSED", "Plan
 * VERIFIED", "Ready to Send". A card that nobody can read, showing a state the
 * product cannot be in, is worse than plain type. Hence: three text sizes, all
 * of them legible at a third of full size, and nothing depicting UI.
 *
 * The palette is READ FROM tokens.css rather than repeated here, because
 * check:tokens keeps that file byte-identical to the site and a hardcoded hex
 * would drift away from the brand the moment the site moves.
 *
 * The typeface is the same Inter that VitePress serves to the docs themselves,
 * loaded from node_modules and inlined as a data URI — the render must not
 * depend on which fonts happen to be installed on the machine.
 *
 * REPRODUCIBLE, unlike shoot-screenshots.mjs: no live data, no dev server. Two
 * runs of this script produce byte-identical files — ON THE SAME BROWSER BINARY.
 * That qualifier is not pedantry: the render resolves a Chromium from several
 * candidates (see `launchCandidates`), and text rasterisation is not guaranteed
 * to match across Chromium builds, so a card shot against a system Chromium may
 * differ by some bytes from one shot against Playwright's pinned build without
 * either being wrong. Playwright's own browser is therefore the reproducibility
 * baseline and is preferred over the system list; when a regenerated card has to
 * be byte-identical to the committed one, shoot it against that.
 */
import { readFileSync, writeFileSync, statSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// playwright is imported inside main(), not here, so `--self-test` stays a pure
// function of strings: it proves the template and the budget without a browser.

const SELF_TEST_FLAG = '--self-test'

const HERE = dirname(fileURLToPath(import.meta.url))
const PUBLIC = resolve(HERE, '../../public')
const TOKENS = resolve(HERE, '../theme/tokens.css')
const FONTS = resolve(HERE, '../../../node_modules/vitepress/dist/client/theme-default/fonts')

/** Open Graph's canonical size. Rendered at 2x so it stays sharp on retina. */
const WIDTH = 1200
const HEIGHT = 630
const SCALE = 2

/** The image is committed, so its weight is capped. */
const MAX_KB = 260

/** Pulled out of tokens.css by name; a missing one is a hard error. */
const NEEDED = [
  'color-bg-primary',
  'color-bg-card',
  'color-accent',
  'color-text-primary',
  'color-text-secondary',
  'color-text-muted',
  'color-border',
]

export function readTokens(css) {
  const out = {}
  for (const name of NEEDED) {
    const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(css)
    if (!match) throw new Error(`tokens.css no longer defines --${name}`)
    out[name] = match[1].trim()
  }
  return out
}

/** The committed weight budget, as its own decision rather than an inline `if`. */
export const budgetVerdict = (file, kb) =>
  kb > MAX_KB ? `${file} is ${kb.toFixed(0)} KB, over the ${MAX_KB} KB budget.` : null

/**
 * Same list `check-layout.mjs` used to carry a copy of, and now imports from here.
 *
 * CI installs Playwright's browser; a dev box often already has a system one, and there is no
 * reason to make that a manual step.
 */
const SYSTEM_CHROMIUM = [
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/snap/bin/chromium',
]

/**
 * The launch options to try, in order: an explicit override, then Playwright's
 * own pinned browser, then whatever Chromium the machine has. Pure so the
 * self-test can prove the one rule that matters here.
 *
 * That rule: an override that does not exist is a HARD ERROR, not a fall-through,
 * and an override that does exist is the only candidate returned — so a launch
 * that then fails is reported instead of quietly becoming a different browser.
 * Silently shooting the committed card with a different binary than the operator
 * named is precisely how the byte-identical promise above stops being true, and
 * it would do it quietly.
 *
 * **`check-layout.mjs` imports this rather than keeping its own answer, and that
 * is a correction rather than tidying.** It used to shrug and try the next
 * candidate, on the argument that a pass/fail check only has to find *some*
 * browser. The argument was wrong twice over, and the fall-through fired for
 * real: Playwright's pinned revision was missing from the local cache, so the
 * whole six-width and forced-colours pass ran against a system Chromium two
 * major versions from the pinned one, silently, while reporting a pass. The case
 * it defended is not "there is no browser anywhere" — that still fails loudly and
 * needs no override to do it — but "the operator named a binary and got a
 * different one". And a layout check does not merely find a browser, it
 * **measures**: geometry at six widths, and a count of distinct painted colours
 * that decides whether a label is legible at all. Glyph rasterisation differs
 * between builds, so a number means nothing without the binary beside it.
 *
 * The import direction is the odd-looking part and is deliberate: a gate importing
 * a generator. The reverse cannot work — `check-layout.mjs` reaches `pages.ts` and
 * so needs `--experimental-strip-types`, which `og-image` does not run with — and
 * a second copy of this decision in the repository that owns the byte-identical
 * promise is worse than an unusual arrow. Nothing here runs on import: playwright
 * is loaded inside `main()`, and `main()` is guarded.
 */
export function launchCandidates(override, exists = existsSync) {
  if (override) {
    if (!exists(override)) {
      throw new Error(
        `PLAYWRIGHT_CHROMIUM_PATH points at ${override}, which does not exist. ` +
          'Fix it or unset it; refusing to fall back to a browser you did not ask for.',
      )
    }
    return [{ executablePath: override }]
  }

  return [{}, ...SYSTEM_CHROMIUM.filter(exists).map((executablePath) => ({ executablePath }))]
}

const dataUri = (path, mime) =>
  `data:${mime};base64,${readFileSync(path).toString('base64')}`

/**
 * Copy. English only, one card for both language trees — the card is brand
 * furniture, not documentation.
 *
 * The headline is a topic, not a promise: the docs are careful never to
 * guarantee that a rescue succeeds, and a poster is the last place to start.
 */
const COPY = {
  en: {
    file: 'og-image.jpg',
    lang: 'en',
    headline: 'How to rescue assets from a compromised wallet',
    sub: 'Step-by-step documentation, in plain language.',
  },
}

export function html(copy, tokens, assets) {
  const t = (name) => tokens[name]
  return `<!doctype html>
<html lang="${copy.lang}"><head><meta charset="utf-8"><style>
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 100 900;
    font-display: block;
    src: url(${assets.interLatin}) format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2212;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    overflow: hidden;
    position: relative;
    background: ${t('color-bg-primary')};
    font-family: 'Inter', sans-serif;
    font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
    -webkit-font-smoothing: antialiased;
  }

  /* One light source, top right. Its centre sits well outside the canvas so
     only the falloff is visible — a defined circle inside the frame reads as a
     pasted-on blob. No decorative line-art either: the old image had chevrons
     bleeding out of the corner, attached to nothing. */
  .glow {
    position: absolute;
    top: -520px; right: -440px;
    width: 1180px; height: 1180px;
    background: radial-gradient(circle,
      color-mix(in srgb, ${t('color-accent')} 13%, transparent) 0%,
      color-mix(in srgb, ${t('color-accent')} 4%, transparent) 44%,
      transparent 68%);
  }

  /* The brand mark as texture, not as an element: fully inside the frame so
     nothing looks accidentally cropped, and faint enough that it never competes
     with the headline. */
  .watermark {
    position: absolute;
    right: 104px; bottom: 96px;
    height: 272px;
    opacity: 0.04;
  }

  .frame {
    position: relative;
    height: 100%;
    padding: 68px 80px 76px;
    display: flex;
    flex-direction: column;
  }

  .lockup { display: flex; align-items: center; gap: 20px; }
  .lockup img { height: 60px; display: block; }
  .wordmark {
    font-size: 44px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: ${t('color-text-primary')};
  }
  .badge {
    padding: 8px 16px 9px;
    border: 1px solid color-mix(in srgb, ${t('color-accent')} 40%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, ${t('color-accent')} 10%, transparent);
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: ${t('color-accent')};
  }

  h1 {
    margin-top: auto;
    max-width: 800px;
    font-size: 62px;
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.025em;
    color: ${t('color-text-primary')};
    text-wrap: balance;
  }

  .rule {
    margin: 30px 0 26px;
    width: 96px; height: 5px;
    border-radius: 3px;
    background: ${t('color-accent')};
  }

  .sub {
    max-width: 760px;
    font-size: 29px;
    font-weight: 400;
    line-height: 1.35;
    color: ${t('color-text-secondary')};
  }

  .foot {
    margin-top: auto;
    padding-top: 40px;
    display: flex;
    align-items: baseline;
    gap: 22px;
    font-size: 24px;
    font-weight: 500;
  }
  .host { color: ${t('color-accent')}; letter-spacing: -0.01em; }
  .langs { color: ${t('color-text-muted')}; letter-spacing: 0.08em; }

  /* Bottom hairline: in a feed the card has no border of its own, and this
     stops the near-black canvas from dissolving into the surrounding chrome. */
  .edge {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 6px;
    background: linear-gradient(90deg,
      ${t('color-accent')} 0%,
      color-mix(in srgb, ${t('color-accent')} 72%, ${t('color-bg-primary')}) 42%,
      color-mix(in srgb, ${t('color-accent')} 28%, ${t('color-bg-primary')}) 74%,
      ${t('color-border')} 100%);
  }
</style></head>
<body>
  <div class="glow"></div>
  <img class="watermark" src="${assets.mark}" alt="">
  <div class="frame">
    <div class="lockup">
      <img src="${assets.mark}" alt="">
      <span class="wordmark">AntiDrain</span>
      <span class="badge">DOCS</span>
    </div>
    <h1>${copy.headline}</h1>
    <div class="rule"></div>
    <p class="sub">${copy.sub}</p>
    <div class="foot">
      <span class="host">docs.antidrain.me</span>
      <span class="langs">RU &middot; EN</span>
    </div>
  </div>
  <div class="edge"></div>
</body></html>`
}

function expectFailure(handler, expectedFragment, description) {
  try {
    handler()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.includes(expectedFragment)) {
      throw new Error(
        `OG image self-test failed: ${description} reported ${JSON.stringify(message)}`,
      )
    }

    return
  }

  throw new Error(`OG image self-test failed: ${description} was accepted`)
}

function runSelfTest() {
  const css = NEEDED.map((name, i) => `  --${name}: #00000${i};`).join('\n')
  const tokens = readTokens(`:root {\n${css}\n}`)
  if (Object.keys(tokens).length !== NEEDED.length) {
    throw new Error(`OG image self-test failed: read ${Object.keys(tokens).length} of ${NEEDED.length} tokens`)
  }

  // The whole reason the palette is read rather than hardcoded: a token the
  // site removed must stop the render, not silently paint `undefined`.
  expectFailure(
    () => readTokens(':root { --color-accent: #10b981; }'),
    'tokens.css no longer defines --color-bg-primary',
    'a palette that lost a token the card needs',
  )

  const markup = html(COPY.en, tokens, { mark: 'data:image/png;base64,AA', interLatin: 'data:font/woff2;base64,BB' })
  for (const fragment of [
    `<html lang="en">`,
    COPY.en.headline,
    COPY.en.sub,
    'docs.antidrain.me',
    `width: ${WIDTH}px`,
    `height: ${HEIGHT}px`,
  ]) {
    if (!markup.includes(fragment)) {
      throw new Error(`OG image self-test failed: the card does not carry ${JSON.stringify(fragment)}`)
    }
  }
  if (markup.includes('undefined')) {
    throw new Error('OG image self-test failed: the card rendered an undefined token')
  }

  // Browser resolution. The override must win outright when it exists, and must
  // stop the run when it does not — a renderer that quietly picks a different
  // binary breaks the byte-identical promise in this file's header.
  const overridden = launchCandidates('/opt/my-chromium', () => true)
  if (overridden.length !== 1 || overridden[0].executablePath !== '/opt/my-chromium') {
    throw new Error(
      `OG image self-test failed: an existing override resolved to ${JSON.stringify(overridden)}`,
    )
  }

  expectFailure(
    () => launchCandidates('/opt/gone', () => false),
    'PLAYWRIGHT_CHROMIUM_PATH points at /opt/gone, which does not exist',
    'an override naming a binary that is not there',
  )

  const fallbacks = launchCandidates(undefined, (path) => path === '/usr/bin/chromium')
  if (Object.keys(fallbacks[0] ?? {}).length !== 0) {
    throw new Error(
      "OG image self-test failed: Playwright's own browser is no longer tried first",
    )
  }
  if (fallbacks.length !== 2 || fallbacks[1].executablePath !== '/usr/bin/chromium') {
    throw new Error(
      `OG image self-test failed: system fallbacks resolved to ${JSON.stringify(fallbacks)}`,
    )
  }
  if (launchCandidates(undefined, () => false).length !== 1) {
    throw new Error('OG image self-test failed: a machine with no system Chromium offered extra candidates')
  }

  if (budgetVerdict('og-image.jpg', MAX_KB - 1) !== null) {
    throw new Error('OG image self-test failed: a file inside the budget was rejected')
  }
  const over = budgetVerdict('og-image.jpg', MAX_KB + 1)
  if (over === null || !over.includes(`over the ${MAX_KB} KB budget`)) {
    throw new Error(`OG image self-test failed: an oversized file reported ${JSON.stringify(over)}`)
  }

  console.log('OG image self-test passed')
}

async function main() {
  if (process.argv.includes(SELF_TEST_FLAG)) {
    runSelfTest()
    return
  }

  const { chromium } = await import('playwright')

  const tokens = readTokens(readFileSync(TOKENS, 'utf8'))
  const assets = {
    mark: dataUri(resolve(PUBLIC, 'antidrain-mark.png'), 'image/png'),
    interLatin: dataUri(resolve(FONTS, 'inter-roman-latin.woff2'), 'font/woff2'),
  }

  let browser
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
    throw new Error(
      `Could not launch Chromium to shoot the card: ${String(lastError).split('\n')[0]}\n` +
        '  Install it with `npx playwright install chromium`, or set ' +
        'PLAYWRIGHT_CHROMIUM_PATH to a Chromium binary.',
    )
  }

  /*
    Which binary drew the card, printed rather than inferred. The header's promise is now
    conditional — byte-identical on the same browser — and a caveat the operator cannot check is
    not worth having: a card shot against a system Chromium differs from the committed one by a
    few hundred bytes of glyph rasterisation, which looks exactly like a real change in a diff.
    This line is how the next person tells "I used a different browser" from "the card changed".
  */
  console.log(
    `og-image: rendering with ${
      chosen.executablePath ?? "Playwright's pinned Chromium (the reproducibility baseline)"
    }`,
  )

  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: SCALE,
  })

  /**
   * Chromium occasionally answers Page.captureScreenshot with "Unable to
   * capture screenshot" on a 2400x1260 surface. Observed once in five runs
   * here, and it succeeds immediately on a second attempt, so it is retried
   * rather than papered over with a smaller canvas.
   */
  const shoot = async (copy) => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await page.screenshot({ type: 'jpeg', quality: 92 })
      } catch (error) {
        if (attempt === 3) throw error
        console.warn(`  ${copy.file}: capture failed, retrying (${error.message})`)
        await page.waitForTimeout(500)
      }
    }
  }

  const written = []
  try {
    for (const copy of Object.values(COPY)) {
      await page.setContent(html(copy, tokens, assets), { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      writeFileSync(resolve(PUBLIC, copy.file), await shoot(copy))
      written.push(copy.file)
    }
  } finally {
    await browser.close()
  }

  let total = 0
  const oversized = []
  for (const file of written) {
    const kb = statSync(resolve(PUBLIC, file)).size / 1024
    total += kb
    const verdict = budgetVerdict(file, kb)
    console.log(`  ${file}  ${kb.toFixed(0)} KB  ${WIDTH * SCALE}x${HEIGHT * SCALE}${verdict ? ' TOO BIG' : ''}`)
    if (verdict) oversized.push(verdict)
  }

  if (oversized.length) {
    for (const verdict of oversized) console.error(verdict)
    process.exitCode = 1
    return
  }

  console.log(`og-image: wrote ${written.length} file(s), ${total.toFixed(0)} KB total`)
}

/**
 * Only run when invoked as a command. Without this guard, importing the pure
 * core — `readTokens`, `budgetVerdict`, `launchCandidates` — launches a browser
 * and overwrites the committed card as a side effect of the import.
 */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
