/**
 * Reports drift between the vendored token block and the site's tokens.css.
 *
 * The site is a separate repository that is not available inside CI, so this is
 * a local-only tool: point ANTIDRAIN_SITE at the checkout and run
 * `npm run tokens:check`. It exits 1 on drift so it can be wired into a
 * pre-release check if the two repos ever end up side by side on a runner.
 * Exit 2 means the comparison could not be made at all, which is a different
 * thing from a clean diff and must never be read as one.
 *
 * ANTIDRAIN_SITE2 is still honoured as the former name of this variable, from
 * when the site checkout had a different directory name.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SELF_TEST_FLAG = '--self-test'

const HERE = dirname(fileURLToPath(import.meta.url))
const LOCAL = resolve(HERE, '../theme/tokens.css')

/** Marks the end of the verbatim region; everything after it is docs-only. */
const DEVIATION_MARKER = '/* ---------------------------------------------------------------------------'
/** Marks the end of the file header comment; everything before it is ours. */
const HEADER_END = ' */'

/**
 * The vendored region: everything between our header comment and the first
 * deviation banner. Throws when either marker is gone, because a silently
 * mislocated region would compare the wrong bytes and pass.
 */
export const extractVendored = (local) => {
  const headerEnd = local.indexOf(HEADER_END)
  const deviations = local.indexOf(DEVIATION_MARKER)
  if (headerEnd === -1 || deviations === -1) {
    throw new Error('tokens.css lost its header or deviation marker; cannot locate the verbatim region.')
  }
  return local.slice(headerEnd + HEADER_END.length, deviations).trim()
}

/** The lines that differ, in the `site -` / `docs +` shape the report prints. */
export const driftReport = (source, vendored) => {
  const a = source.split('\n')
  const b = vendored.split('\n')
  const lines = []
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      if (a[i] !== undefined) lines.push(`  site :${String(i + 1).padStart(4)} - ${a[i]}`)
      if (b[i] !== undefined) lines.push(`  docs :${String(i + 1).padStart(4)} + ${b[i]}`)
    }
  }
  return lines
}

function expectFailure(handler, expectedFragment, description) {
  try {
    handler()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.includes(expectedFragment)) {
      throw new Error(
        `Token drift self-test failed: ${description} reported ${JSON.stringify(message)}`,
      )
    }

    return
  }

  throw new Error(`Token drift self-test failed: ${description} was accepted`)
}

function runSelfTest() {
  const vendored = ':root {\n  --color-accent: #10b981;\n}'
  const local = `/* header\n${HEADER_END}\n\n${vendored}\n\n${DEVIATION_MARKER}\n   docs-only deviation\n*/\n:root { --docs-only: 1; }\n`

  if (extractVendored(local) !== vendored) {
    throw new Error(`Token drift self-test failed: extracted ${JSON.stringify(extractVendored(local))}`)
  }
  // The bytes after the deviation banner are ours and must stay out of the diff.
  if (extractVendored(local).includes('--docs-only')) {
    throw new Error('Token drift self-test failed: the deviation region leaked into the vendored block')
  }

  expectFailure(
    () => extractVendored(':root { --color-accent: #10b981; }\n'),
    'lost its header or deviation marker',
    'a tokens.css with no markers to locate the region by',
  )

  if (driftReport(vendored, vendored).length !== 0) {
    throw new Error('Token drift self-test failed: identical text reported drift')
  }

  const drifted = driftReport(vendored, vendored.replace('#10b981', '#0ea5e9'))
  if (drifted.length !== 2 || !drifted[0].includes('- ') || !drifted[1].includes('+ ')) {
    throw new Error(`Token drift self-test failed: one changed line reported ${JSON.stringify(drifted)}`)
  }
  if (!drifted[0].includes('#10b981') || !drifted[1].includes('#0ea5e9')) {
    throw new Error('Token drift self-test failed: the report does not name both values')
  }

  // A shorter docs copy is drift too — a dropped tail must not read as clean.
  if (driftReport(`${vendored}\n--extra: 1;`, vendored).length !== 1) {
    throw new Error('Token drift self-test failed: a truncated docs copy did not report drift')
  }

  console.log('Token drift self-test passed')
}

function main() {
  if (process.argv.includes(SELF_TEST_FLAG)) {
    runSelfTest()
    return
  }

  const site = process.env.ANTIDRAIN_SITE
    ?? process.env.ANTIDRAIN_SITE2
    ?? resolve(HERE, '../../../../antidrain_site')
  const upstream = join(site, 'src/styles/tokens.css')

  if (!existsSync(upstream)) {
    console.error(`site tokens.css not found at ${upstream}`)
    console.error('Set ANTIDRAIN_SITE to the site checkout and retry.')
    process.exitCode = 2
    return
  }

  let vendored
  try {
    vendored = extractVendored(readFileSync(LOCAL, 'utf8'))
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 2
    return
  }

  const source = readFileSync(upstream, 'utf8').trim()
  if (vendored === source) {
    console.log('tokens.css is in sync with the site.')
    return
  }

  console.error('tokens.css has DRIFTED from the site.\n')
  for (const line of driftReport(source, vendored)) console.error(line)
  console.error('\nResolve by porting the site value across, not by editing docs in isolation.')
  process.exitCode = 1
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
