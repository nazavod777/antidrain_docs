/**
 * Reports drift between the vendored token block and site2's tokens.css.
 *
 * site2 is a separate repository that is not available inside CI, so this is a
 * local-only tool: point ANTIDRAIN_SITE2 at the checkout and run
 * `npm run tokens:check`. It exits 1 on drift so it can be wired into a
 * pre-release check if the two repos ever end up side by side on a runner.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const LOCAL = resolve(HERE, '../theme/tokens.css')

/** Marks the end of the verbatim region; everything after it is docs-only. */
const DEVIATION_MARKER = '/* ---------------------------------------------------------------------------'
/** Marks the end of the file header comment; everything before it is ours. */
const HEADER_END = ' */'

const site2 = process.env.ANTIDRAIN_SITE2
  ?? resolve(HERE, '../../../../antidrain_site2')
const upstream = join(site2, 'src/styles/tokens.css')

if (!existsSync(upstream)) {
  console.error(`site2 tokens.css not found at ${upstream}`)
  console.error('Set ANTIDRAIN_SITE2 to the site2 checkout and retry.')
  process.exit(2)
}

const local = readFileSync(LOCAL, 'utf8')
const headerEnd = local.indexOf(HEADER_END)
const deviations = local.indexOf(DEVIATION_MARKER)

if (headerEnd === -1 || deviations === -1) {
  console.error('tokens.css lost its header or deviation marker; cannot locate the verbatim region.')
  process.exit(2)
}

const vendored = local.slice(headerEnd + HEADER_END.length, deviations).trim()
const source = readFileSync(upstream, 'utf8').trim()

if (vendored === source) {
  console.log('tokens.css is in sync with site2.')
  process.exit(0)
}

console.error('tokens.css has DRIFTED from site2.\n')
const a = source.split('\n')
const b = vendored.split('\n')
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  if (a[i] !== b[i]) {
    if (a[i] !== undefined) console.error(`  site2:${String(i + 1).padStart(4)} - ${a[i]}`)
    if (b[i] !== undefined) console.error(`  docs :${String(i + 1).padStart(4)} + ${b[i]}`)
  }
}
console.error('\nResolve by porting the site2 value across, not by editing docs in isolation.')
process.exit(1)
