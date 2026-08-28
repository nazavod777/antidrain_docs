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

const THEME = resolve(dirname(fileURLToPath(import.meta.url)), '../theme')

const srgb = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const luminance = (hex) => {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
}
const contrast = (fg, bg) => {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}
const flatten = (rgbTriplet, alpha, backdrop) => {
  const b = backdrop.replace('#', '')
  const bg = [0, 2, 4].map(i => parseInt(b.slice(i, i + 2), 16))
  return '#' + rgbTriplet
    .map((v, i) => Math.round(v * alpha + bg[i] * (1 - alpha)).toString(16).padStart(2, '0'))
    .join('')
}

/** Reads `--name: #hex;` declarations out of the first block matching `selector`. */
const readTokens = (file, selector) => {
  const css = readFileSync(resolve(THEME, file), 'utf8')
  const start = css.indexOf(selector)
  if (start === -1) throw new Error(`${selector} not found in ${file}`)
  const block = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  const out = {}
  for (const m of block.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{6}|[\d\s,]+);/g)) {
    out[m[1]] = m[2].trim()
  }
  return out
}

const dark = readTokens('tokens.css', ':root {')
const light = readTokens('light.css', ':root:not(.dark) {')

const BODY = 4.5      // WCAG 1.4.3 normal text
const NON_TEXT = 3    // WCAG 1.4.11 UI components and focus indicators

/** Surfaces that body copy can legitimately land on. */
const surfaceKeys = ['bg-primary', 'bg-secondary', 'bg-card', 'bg-card-hover']
/** Foregrounds that carry readable text. */
const textKeys = [
  'text-primary', 'text-secondary', 'text-muted',
  'danger-text', 'warning-text', 'success-text',
]

const failures = []
const check = (label, fg, bg, need) => {
  const r = contrast(fg, bg)
  const ok = r >= need
  if (!ok) failures.push(`${label}: ${r.toFixed(2)}:1 (need ${need}:1) — ${fg} on ${bg}`)
  return ok
}

for (const [themeName, t] of [['dark', dark], ['light', { ...dark, ...light }]]) {
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

  // Callout: the mono title sits on the -dim tint composed from the triplet.
  for (const family of ['danger', 'warning', 'success', 'accent']) {
    const triplet = t[`color-${family}-rgb`].split(',').map(n => parseInt(n.trim(), 10))
    const dim = flatten(triplet, 0.08, t['color-bg-primary'])
    const title = family === 'accent' ? accentText : t[`color-${family}-text`]
    check(`${themeName} ${family} callout title on its dim tint`, title, dim, BODY)
  }
}

// the site's rule, enforced: a focus ring must never be built from a translucent
// colour. Catching it here is cheaper than measuring 1.4:1 rings in a browser.
for (const [file, sel] of [['tokens.css', ':root {'], ['light.css', ':root:not(.dark) {']]) {
  const css = readFileSync(resolve(THEME, file), 'utf8')
  const m = css.slice(css.indexOf(sel)).match(/--focus-ring\s*:\s*([^;]+);/)
  if (m && /rgba|-dim|-border/.test(m[1])) {
    failures.push(`${file}: --focus-ring is built from a translucent colour: ${m[1].trim()}`)
  }
}

if (failures.length) {
  console.error('Contrast check FAILED:\n')
  for (const f of failures) console.error(`  ${f}`)
  console.error(`\n${failures.length} failure(s).`)
  process.exit(1)
}
console.log('Contrast check passed for both themes.')
