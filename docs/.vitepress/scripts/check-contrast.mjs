/**
 * WCAG contrast gate for both themes.
 *
 * Colours are parsed out of theme/tokens.css and theme/light.css rather than
 * duplicated here, so editing a token and forgetting to re-check is a failing
 * build rather than a silent regression. Mirrors the intent of the site's
 * scripts/checkInteractionAffordances.mjs.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SELF_TEST_FLAG = '--self-test'

const THEME = resolve(dirname(fileURLToPath(import.meta.url)), '../theme')

const srgb = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
/** Six hex digits, with or without the `#`. Nothing else is a colour this file can measure. */
const SIX_DIGIT_HEX = /^#?[0-9a-fA-F]{6}$/u
const luminance = (hex) => {
  // NaN rather than a throw, so the one place that decides — `check` below — can name the pair the
  // colour belongs to. Reaching this with a shorthand `#fff`, a `var()` reference or `undefined`
  // (parseTokens keeps only six-digit hex and rgb triplets, so a token it did not recognise is
  // simply absent) used to raise "Cannot read properties of undefined", which says nothing about
  // which token in which theme.
  if (typeof hex !== 'string' || !SIX_DIGIT_HEX.test(hex)) return NaN
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
}
export const contrast = (fg, bg) => {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}
export const flatten = (rgbTriplet, alpha, backdrop) => {
  const b = backdrop.replace('#', '')
  const bg = [0, 2, 4].map(i => parseInt(b.slice(i, i + 2), 16))
  return '#' + rgbTriplet
    .map((v, i) => Math.round(v * alpha + bg[i] * (1 - alpha)).toString(16).padStart(2, '0'))
    .join('')
}

/** Reads `--name: #hex;` declarations out of the first block matching `selector`. */
export const parseTokens = (css, selector, whence) => {
  const start = css.indexOf(selector)
  if (start === -1) throw new Error(`${selector} not found in ${whence}`)
  const block = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  const out = {}
  for (const m of block.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{6}|[\d\s,]+);/g)) {
    out[m[1]] = m[2].trim()
  }
  return out
}

const BODY = 4.5      // WCAG 1.4.3 normal text
const NON_TEXT = 3    // WCAG 1.4.11 UI components and focus indicators

/** Surfaces that body copy can legitimately land on. */
const surfaceKeys = ['bg-primary', 'bg-secondary', 'bg-card', 'bg-card-hover']
/** Foregrounds that carry readable text. */
const textKeys = [
  'text-primary', 'text-secondary', 'text-muted',
  'danger-text', 'warning-text', 'success-text',
]

/**
 * The whole check, as a pure function of injected content.
 *
 * `tokens` is `{ dark, light }`, each a `--name` → value map; `focusRings` is
 * `{ <file>: <css text> }`. Returns how many pairs were measured, and throws
 * naming every one that falls short.
 */
export const assertContrast = ({ tokens, focusRings }) => {
  const failures = []
  let measured = 0
  const check = (label, fg, bg, need) => {
    measured++
    const r = contrast(fg, bg)
    // NaN first, and as its own message. A colour this file cannot parse — a shorthand `#fff`, a
    // `var()` reference, a hex where an rgb triplet belongs, a token that is simply absent — makes
    // the ratio NaN, and every comparison against NaN is false. `r < need` therefore reads an
    // unparseable colour as a pass, and the gate goes green on a pair nobody measured.
    // It is also not a contrast failure: printing "NaN:1 (need 4.5:1)" would send someone off to
    // adjust a colour that is not too dark but not a colour at all.
    if (!Number.isFinite(r)) {
      failures.push(
        `${label}: unparseable colour, so no ratio could be measured — ` +
          `${fg} on ${bg}. Both have to be six-digit hex from tokens.css or light.css; ` +
          `"undefined" means the token is missing or in a form parseTokens does not read.`,
      )
      return
    }
    if (r < need) failures.push(`${label}: ${r.toFixed(2)}:1 (need ${need}:1) — ${fg} on ${bg}`)
  }

  for (const [themeName, t] of [['dark', tokens.dark], ['light', { ...tokens.dark, ...tokens.light }]]) {
    const accentText = t['color-accent-text']?.startsWith('#')
      ? t['color-accent-text']
      : t['color-accent']

    for (const s of surfaceKeys) {
      const bg = t[`color-${s}`]
      for (const f of textKeys) check(`${themeName} ${f} on ${s}`, t[`color-${f}`], bg, BODY)
      check(`${themeName} accent-text on ${s}`, accentText, bg, BODY)
      // The focus ring is drawn on top of whatever surface the control sits on.
      check(`${themeName} focus ring on ${s}`, accentText, bg, NON_TEXT)
    }

    // Accent-filled control: the ink must be readable at rest and on hover.
    const ink = themeName === 'light' ? '#04110e' : t['color-bg-primary']
    check(`${themeName} on-accent ink on accent`, ink, t['color-accent'], BODY)
    check(`${themeName} on-accent ink on accent-hover`, ink, t['color-accent-hover'], BODY)

    // Callout: the mono title sits on the -dim tint composed from the triplet. Both inputs are
    // validated here rather than inside flatten(), because this is the only place that knows which
    // token a bad value came from — and "Cannot read properties of undefined (reading 'split')" is
    // a stack trace, not a check result. A tint that cannot be composed is reported, not measured.
    const backdrop = t['color-bg-primary']

    for (const family of ['danger', 'warning', 'success', 'accent']) {
      const raw = t[`color-${family}-rgb`]
      const triplet = typeof raw === 'string' ? raw.split(',').map(n => parseInt(n.trim(), 10)) : []
      const title = family === 'accent' ? accentText : t[`color-${family}-text`]
      const label = `${themeName} ${family} callout title on its dim tint`

      if (triplet.length !== 3 || triplet.some((v) => !Number.isInteger(v))) {
        failures.push(`${label}: --color-${family}-rgb is ${raw}, not an "r, g, b" triplet`)
        continue
      }
      if (!SIX_DIGIT_HEX.test(backdrop ?? '')) {
        failures.push(`${label}: --color-bg-primary is ${backdrop}, so the tint composes onto nothing`)
        continue
      }

      check(label, title, flatten(triplet, 0.08, backdrop), BODY)
    }
  }

  // the site's rule, enforced: a focus ring must never be built from a translucent
  // colour. Catching it here is cheaper than measuring 1.4:1 rings in a browser.
  for (const [file, { css, selector }] of Object.entries(focusRings)) {
    const m = css.slice(css.indexOf(selector)).match(/--focus-ring\s*:\s*([^;]+);/)
    if (m && /rgba|-dim|-border/.test(m[1])) {
      failures.push(`${file}: --focus-ring is built from a translucent colour: ${m[1].trim()}`)
    }
  }

  if (failures.length) {
    throw new Error(
      ['Contrast check FAILED:', '']
        .concat(failures.map((f) => `  ${f}`))
        .concat('', `${failures.length} failure(s).`)
        .join('\n'),
    )
  }

  return measured
}

function expectFailure(handler, expectedFragment, description) {
  try {
    handler()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.includes(expectedFragment)) {
      throw new Error(
        `Contrast check self-test failed: ${description} reported ${JSON.stringify(message)}`,
      )
    }

    return
  }

  throw new Error(`Contrast check self-test failed: ${description} was accepted`)
}

function runSelfTest() {
  // The maths first: black on white is WCAG's 21:1 ceiling, and a colour
  // against itself is the 1:1 floor. A ratio function that drifted would make
  // every assertion below meaningless.
  if (Math.abs(contrast('#000000', '#ffffff') - 21) > 0.001) {
    throw new Error(`Contrast check self-test failed: black on white measured ${contrast('#000000', '#ffffff')}`)
  }
  if (Math.abs(contrast('#123456', '#123456') - 1) > 0.001) {
    throw new Error('Contrast check self-test failed: a colour against itself is not 1:1')
  }
  // 8% of white over black composites to #141414, not to white.
  if (flatten([255, 255, 255], 0.08, '#000000') !== '#141414') {
    throw new Error(`Contrast check self-test failed: flatten produced ${flatten([255, 255, 255], 0.08, '#000000')}`)
  }

  const parsed = parseTokens(':root { --color-accent: #00ff00; --ignored: 1px; --color-danger-rgb: 255, 0, 0; }\n:root { --color-accent: #ff0000; }', ':root {', 'fixture')
  if (parsed['color-accent'] !== '#00ff00' || parsed['color-danger-rgb'] !== '255, 0, 0' || 'ignored' in parsed) {
    throw new Error(`Contrast check self-test failed: parseTokens produced ${JSON.stringify(parsed)}`)
  }
  expectFailure(
    () => parseTokens('.something {}', ':root {', 'fixture'),
    ':root { not found in fixture',
    'a theme file that lost its :root block',
  )

  // A palette that passes everything: white ink on black surfaces throughout.
  const passing = {
    'color-bg-primary': '#000000',
    'color-bg-secondary': '#000000',
    'color-bg-card': '#000000',
    'color-bg-card-hover': '#000000',
    'color-text-primary': '#ffffff',
    'color-text-secondary': '#ffffff',
    'color-text-muted': '#ffffff',
    'color-danger-text': '#ffffff',
    'color-warning-text': '#ffffff',
    'color-success-text': '#ffffff',
    'color-accent-text': '#ffffff',
    'color-accent': '#ffffff',
    'color-accent-hover': '#ffffff',
    'color-danger-rgb': '255, 255, 255',
    'color-warning-rgb': '255, 255, 255',
    'color-success-rgb': '255, 255, 255',
    'color-accent-rgb': '255, 255, 255',
  }
  const rings = { 'tokens.css': { css: ':root { --focus-ring: 2px solid var(--color-accent); }', selector: ':root {' } }
  const measured = assertContrast({ tokens: { dark: passing, light: {} }, focusRings: rings })
  // Two themes x (4 surfaces x (6 text + accent text + focus ring) + 2 accent
  // inks + 4 callout titles). A drop here means a rule stopped being measured.
  if (measured !== 76) {
    throw new Error(`Contrast check self-test failed: expected 76 measured pairs, saw ${measured}`)
  }

  expectFailure(
    () =>
      assertContrast({
        tokens: { dark: { ...passing, 'color-text-muted': '#111111' }, light: {} },
        focusRings: rings,
      }),
    // The ratio is part of the expectation on purpose: "dark text-muted on bg-primary" alone is
    // also a prefix of the unparseable-colour message, so this case would stay green while proving
    // something else entirely.
    'dark text-muted on bg-primary: 1.11:1 (need 4.5:1)',
    'body copy that fell below 4.5:1',
  )

  expectFailure(
    () =>
      assertContrast({
        tokens: { dark: passing, light: { ...passing, 'color-accent': '#010101' } },
        focusRings: rings,
      }),
    'light on-accent ink on accent',
    'a light-theme accent that swallowed its own ink',
  )

  // The one a comparison cannot catch. `#fff` is a legal CSS colour and an illegal one here: the
  // ratio comes out NaN, `NaN < 4.5` is false, and the pair used to count as measured and pass.
  // The message has to name the parse, not a ratio.
  if (Number.isFinite(contrast('#fff', '#000000'))) {
    throw new Error('Contrast check self-test failed: a three-digit hex must not measure as a ratio')
  }
  expectFailure(
    () =>
      assertContrast({
        tokens: { dark: { ...passing, 'color-text-secondary': '#fff' }, light: {} },
        focusRings: rings,
      }),
    'dark text-secondary on bg-primary: unparseable colour',
    'a token that is not a six-digit hex colour',
  )

  // The same hole reached the way a real theme file reaches it: parseTokens keeps six-digit hex and
  // rgb triplets and drops everything else, so a mistyped token arrives here as undefined rather
  // than as a bad string. That used to raise "Cannot read properties of undefined" from inside
  // luminance, naming no token, no theme and no pair.
  expectFailure(
    () => {
      const { 'color-text-muted': _dropped, ...missing } = passing
      return assertContrast({ tokens: { dark: missing, light: {} }, focusRings: rings })
    },
    'dark text-muted on bg-primary: unparseable colour',
    'a token parseTokens did not recognise, so it never reached the palette',
  )

  // The two inputs to the callout tint, each of which used to reach flatten() as undefined and
  // raise a TypeError naming neither the token nor the theme.
  expectFailure(
    () =>
      assertContrast({
        tokens: { dark: { ...passing, 'color-warning-rgb': '#ffffff' }, light: {} },
        focusRings: rings,
      }),
    'dark warning callout title on its dim tint: --color-warning-rgb is #ffffff',
    'an rgb triplet token written as a hex colour',
  )

  expectFailure(
    () => {
      const { 'color-success-rgb': _dropped, ...missing } = passing
      return assertContrast({ tokens: { dark: missing, light: {} }, focusRings: rings })
    },
    'dark success callout title on its dim tint: --color-success-rgb is undefined',
    'a callout family whose rgb triplet is missing',
  )

  expectFailure(
    () => {
      const { 'color-bg-primary': _dropped, ...missing } = passing
      return assertContrast({ tokens: { dark: missing, light: {} }, focusRings: rings })
    },
    'dark danger callout title on its dim tint: --color-bg-primary is undefined',
    'a theme with no base surface for the callout tint to composite onto',
  )

  expectFailure(
    () =>
      assertContrast({
        tokens: { dark: passing, light: {} },
        focusRings: {
          'light.css': { css: ':root:not(.dark) { --focus-ring: 2px solid rgba(0,0,0,.4); }', selector: ':root:not(.dark) {' },
        },
      }),
    'light.css: --focus-ring is built from a translucent colour',
    'a focus ring built from a translucent colour',
  )

  console.log('Contrast check self-test passed')
}

const readTheme = (file) => readFileSync(resolve(THEME, file), 'utf8')

function main() {
  if (process.argv.includes(SELF_TEST_FLAG)) {
    runSelfTest()
    return
  }

  const files = [['tokens.css', ':root {'], ['light.css', ':root:not(.dark) {']]
  const css = Object.fromEntries(files.map(([file, selector]) => [file, { css: readTheme(file), selector }]))

  assertContrast({
    tokens: {
      dark: parseTokens(css['tokens.css'].css, ':root {', 'tokens.css'),
      light: parseTokens(css['light.css'].css, ':root:not(.dark) {', 'light.css'),
    },
    focusRings: css,
  })

  console.log('Contrast check passed for both themes.')
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
