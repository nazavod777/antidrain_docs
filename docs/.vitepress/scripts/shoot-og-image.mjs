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
 * check:tokens keeps that file byte-identical to site2 and a hardcoded hex
 * would drift away from the brand the moment site2 moves.
 *
 * The typeface is the same Inter that VitePress serves to the docs themselves,
 * loaded from node_modules and inlined as a data URI — the render must not
 * depend on which fonts happen to be installed on the machine.
 *
 * REPRODUCIBLE, unlike shoot-screenshots.mjs: no live data, no dev server. Two
 * runs of this script produce byte-identical files.
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

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

function readTokens() {
  const css = readFileSync(TOKENS, 'utf8')
  const out = {}
  for (const name of NEEDED) {
    const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(css)
    if (!match) throw new Error(`tokens.css no longer defines --${name}`)
    out[name] = match[1].trim()
  }
  return out
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

function html(copy, tokens, assets) {
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

const tokens = readTokens()
const assets = {
  mark: dataUri(resolve(PUBLIC, 'antidrain-mark.png'), 'image/png'),
  interLatin: dataUri(resolve(FONTS, 'inter-roman-latin.woff2'), 'font/woff2'),
}

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: SCALE,
})

/**
 * Chromium occasionally answers Page.captureScreenshot with "Unable to capture
 * screenshot" on a 2400x1260 surface. Observed once in five runs here, and it
 * succeeds immediately on a second attempt, so it is retried rather than
 * papered over with a smaller canvas.
 */
async function shoot(copy) {
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
for (const copy of Object.values(COPY)) {
  await page.setContent(html(copy, tokens, assets), { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  writeFileSync(resolve(PUBLIC, copy.file), await shoot(copy))
  written.push(copy.file)
}

await browser.close()

let total = 0
for (const file of written) {
  const kb = statSync(resolve(PUBLIC, file)).size / 1024
  total += kb
  const flag = kb > MAX_KB ? ' TOO BIG' : ''
  console.log(`  ${file}  ${kb.toFixed(0)} KB  ${WIDTH * SCALE}x${HEIGHT * SCALE}${flag}`)
  if (kb > MAX_KB) {
    console.error(`${file} is ${kb.toFixed(0)} KB, over the ${MAX_KB} KB budget.`)
    process.exit(1)
  }
}
console.log(`og-image: wrote ${written.length} file(s), ${total.toFixed(0)} KB total`)
