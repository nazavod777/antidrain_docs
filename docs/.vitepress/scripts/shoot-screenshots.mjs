/**
 * Regenerates the UI screenshots used in the docs.
 *
 * The docs name interface elements constantly ("press Build Transaction",
 * "check the summary"), so a reader needs to see the screen. Hand-taken
 * screenshots go stale silently, which is why this is a script: after a site
 * redesign, `npm run screenshots` is the whole update.
 *
 * NOT BYTE-REPRODUCIBLE. Every frame contains the live block number and gas
 * price, so a rerun changes all of them. Verified: two consecutive runs
 * produced the same file set and the same total size, and six of six files
 * differed byte for byte. Judge a rerun by the file list and the budget, not by
 * the diff — and look at the images, because that is the only check that
 * catches a UI change.
 *
 * SECRETS. The product already masks the mnemonic and the private key behind
 * dots, so simply not clicking "show" keeps them off the image. That is an
 * absence of exposure rather than a defence, so every field that can hold a
 * secret is also blurred here before the shutter. Both layers, deliberately.
 *
 * STALENESS. Because the bytes cannot be compared, every run also records what
 * each frame rendered — text, controls, geometry, a few styles — in
 * `docs/.vitepress/screenshots/manifest.json`, next to a hash of each committed image.
 * `--check` renders the same flow, writes nothing, and fails when the site no
 * longer draws what the frames show (`docs/.vitepress/screenshots/fingerprint.mjs` owns the rules).
 *
 * ALL OR NOTHING. A frame that cannot be reached fails the run: a missing step
 * used to be a warning, and the set that came out was committed half-empty.
 * Frames are shot into a scratch directory and replace the committed ones only
 * after every frame, the optimiser and the budget have passed, and the
 * replacement itself is a set of renames that is undone if any of them fails
 * (`replaceCommitted`). That is a rollback, not an atomic swap: a failing rename
 * leaves the old set, while a process killed between two renames can leave a
 * mix — `git status` shows it, and a rerun replaces it.
 *
 * Requires a site checkout with dependencies installed. Point ANTIDRAIN_SITE
 * at it, or keep it next to this repo. If a site dev server is already
 * running, pass SITE_URL and this reuses it instead of starting another.
 *
 * ANTIDRAIN_SITE2 and SITE2_URL are still honoured as the former names of these
 * variables, from when the site checkout had a different directory name.
 */
import { cpSync, existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  LIVE_PLACEHOLDER,
  LIVE_SELECTORS,
  MANIFEST_VERSION,
  STYLE_PROPERTIES,
  auditManifest,
  collectFingerprint,
  hashBytes,
  missingFrames,
  runManifestSelfTest,
  sealFrame,
} from '../screenshots/fingerprint.mjs'

const SELF_TEST_FLAG = '--self-test'
const CHECK_FLAG = '--check'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT_ROOT = resolve(HERE, '../../public/screenshots')
const MANIFEST_PATH = resolve(HERE, '../screenshots/manifest.json')
/** Gitignored and on the same filesystem as the frames, so the final swap is a rename. */
const SWAP_ROOT = resolve(HERE, '../cache')
const SITE = process.env.ANTIDRAIN_SITE
  ?? process.env.ANTIDRAIN_SITE2
  ?? resolve(HERE, '../../../../antidrain_site')
const SITE_URL = process.env.SITE_URL ?? process.env.SITE2_URL

/** Per-file and total budgets. Screenshots are committed, so this matters. */
const MAX_FILE_KB = 120
const MAX_TOTAL_KB = 1200

/** Anything that could render a secret, blurred before every shot. */
const SECRET_SELECTORS = [
  '.wf__value--mono',
  '[class*="mnemonic"]',
  '[class*="privateKey"]',
  '[class*="private-key"]',
]

const LANGS = ['ru', 'en']

const labels = {
  ru: {
    create: 'Создать кошелёк',
    export: 'Экспортировать резервную копию',
    step2: 'Выбор действия',
    customAction: 'Конструктор Custom TX',
    addKey: 'Добавить приватный ключ',
    addTx: 'Добавить транзакцию',
  },
  en: {
    create: 'Generate Wallet',
    export: 'Export Backup',
    step2: 'Select Action',
    customAction: 'Custom TX Builder',
    addKey: 'Add Private Key',
    addTx: 'Add Transaction',
  },
}

/**
 * The four transaction types inside Custom TX Builder, in the order the picker
 * renders them (CustomWalletItem.tsx TX_TYPE_KEYS).
 */
const TX_TYPES = ['erc20', 'erc721', 'erc1155', 'custom']

/** A throwaway key so the builder has a wallet to attach transactions to. It is
 *  generated per run, never funded, and blurred in every frame. */
export const throwawayKey = () =>
  '0x' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')

/** The name of the frame for a transaction type, in picker order. */
export const txFrameName = (index, type) => `0${6 + index}-tx-${type}`

/** Every frame a run must produce, per locale. The docs reference them by file name. */
export const EXPECTED_FRAMES = [
  '01-donor-empty',
  '02-donor-created',
  '03-select-action',
  '04-header',
  '05-tx-types',
  ...TX_TYPES.map((type, index) => txFrameName(index, type)),
]

/** A frame the flow could not reach ends the run; see ALL OR NOTHING above. */
const unreachable = (lang, what) => new Error(`${lang}: ${what}; no frame was replaced`)

/**
 * The committed weight budget, as a pure function of the file sizes.
 *
 * `files` is `[{ name, kb }]`. Returns the total and every breach, so the
 * caller reports all of them rather than the first.
 */
export const budgetFailures = (files, { maxFileKb, maxTotalKb }) => {
  const total = files.reduce((sum, f) => sum + f.kb, 0)
  const oversized = files.filter((f) => f.kb > maxFileKb).map((f) => `${f.name} is ${f.kb.toFixed(0)} KB`)
  return { total, oversized, overTotal: total > maxTotalKb }
}

/**
 * Every locale must name every control this script clicks. A missing string
 * makes the run click nothing and shoot a half-empty screen, which is the kind
 * of defect that only shows up when someone finally looks at the image.
 */
export const assertLabelParity = (labels, langs) => {
  const expected = Object.keys(labels[langs[0]]).sort()
  for (const lang of langs) {
    const got = Object.keys(labels[lang] ?? {}).sort()
    if (got.join('|') !== expected.join('|')) {
      throw new Error(
        `labels.${lang} does not match labels.${langs[0]}: ${got.join(', ') || '—'} vs ${expected.join(', ')}`,
      )
    }
    for (const [key, value] of Object.entries(labels[lang])) {
      if (!String(value ?? '').trim()) throw new Error(`labels.${lang}.${key} is empty`)
    }
  }
  return expected.length
}

/** Boots the site's dev server and resolves with its URL. */
const startSite = () =>
  new Promise((ready, fail) => {
    // detached so the whole npm -> vite process group can be killed by group
    // id later. Without it, killing `npm` leaves vite running and the signal
    // lands on this process instead.
    const proc = spawn('npm', ['run', 'dev'], {
      cwd: SITE,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    })
    const timer = setTimeout(() => fail(new Error('site dev server did not start in 60s')), 60_000)
    proc.stdout.on('data', (chunk) => {
      const match = /http:\/\/localhost:(\d+)\//.exec(String(chunk))
      if (match) {
        clearTimeout(timer)
        ready({ proc, url: match[0] })
      }
    })
    proc.on('exit', (code) => fail(new Error(`site dev server exited with ${code}`)))
  })

const blurSecrets = (page) =>
  page.evaluate((selectors) => {
    for (const selector of selectors) {
      for (const el of document.querySelectorAll(selector)) {
        el.style.filter = 'blur(6px)'
      }
    }
  }, SECRET_SELECTORS)

function expectFailure(handler, expectedFragment, description) {
  try {
    handler()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (!message.includes(expectedFragment)) {
      throw new Error(
        `Screenshot self-test failed: ${description} reported ${JSON.stringify(message)}`,
      )
    }

    return
  }

  throw new Error(`Screenshot self-test failed: ${description} was accepted`)
}

function runSelfTest() {
  // The throwaway key must look like a private key to the product's own input
  // validation, or the builder never accepts it and the frames come out empty.
  const key = throwawayKey()
  if (!/^0x[0-9a-f]{64}$/.test(key)) {
    throw new Error(`Screenshot self-test failed: throwaway key was ${key}`)
  }
  if (throwawayKey() === throwawayKey()) {
    throw new Error('Screenshot self-test failed: the throwaway key is not generated per run')
  }

  // Frame names must stay in picker order and stay sortable, because the docs
  // reference them by file name.
  const names = TX_TYPES.map((type, index) => txFrameName(index, type))
  if (names.join(',') !== '06-tx-erc20,07-tx-erc721,08-tx-erc1155,09-tx-custom') {
    throw new Error(`Screenshot self-test failed: frame names were ${names.join(',')}`)
  }

  // Product vocabulary is copied from the site, and both locales must carry all
  // of it. Six labels today.
  if (assertLabelParity(labels, LANGS) !== 6) {
    throw new Error('Screenshot self-test failed: the label set changed size without this test noticing')
  }
  expectFailure(
    () => assertLabelParity({ ...labels, en: { ...labels.en, addTx: undefined } }, LANGS),
    'labels.en.addTx is empty',
    'a locale that lost one of the strings the run clicks',
  )
  expectFailure(
    () => assertLabelParity({ ru: labels.ru, en: { create: 'Generate Wallet' } }, LANGS),
    'labels.en does not match labels.ru',
    'a locale missing half its strings',
  )

  // Every field that could hold a secret is blurred before the shutter. An
  // empty list would silently turn that second layer off.
  if (SECRET_SELECTORS.length === 0) {
    throw new Error('Screenshot self-test failed: nothing would be blurred before the shutter')
  }

  const within = budgetFailures(
    [{ name: 'ru/01.png', kb: MAX_FILE_KB - 1 }, { name: 'en/01.png', kb: 1 }],
    { maxFileKb: MAX_FILE_KB, maxTotalKb: MAX_TOTAL_KB },
  )
  if (within.oversized.length || within.overTotal) {
    throw new Error(`Screenshot self-test failed: a set inside the budget was rejected (${JSON.stringify(within)})`)
  }

  const big = budgetFailures([{ name: 'ru/01.png', kb: MAX_FILE_KB + 1 }], { maxFileKb: MAX_FILE_KB, maxTotalKb: MAX_TOTAL_KB })
  if (big.oversized.length !== 1 || !big.oversized[0].includes('ru/01.png is')) {
    throw new Error(`Screenshot self-test failed: an oversized file reported ${JSON.stringify(big.oversized)}`)
  }

  const many = budgetFailures(
    Array.from({ length: 40 }, (_, i) => ({ name: `ru/${i}.png`, kb: MAX_FILE_KB - 1 })),
    { maxFileKb: MAX_FILE_KB, maxTotalKb: MAX_TOTAL_KB },
  )
  if (!many.overTotal || many.oversized.length !== 0) {
    throw new Error('Screenshot self-test failed: many small files did not breach the total budget')
  }

  // The frame list is what both the run and the check hold the set to, so it
  // must be complete, unique and sortable in the order the docs show them.
  if (EXPECTED_FRAMES.length !== 9 || new Set(EXPECTED_FRAMES).size !== 9) {
    throw new Error(`Screenshot self-test failed: the expected frames were ${EXPECTED_FRAMES.join(',')}`)
  }
  if ([...EXPECTED_FRAMES].sort().join(',') !== EXPECTED_FRAMES.join(',')) {
    throw new Error('Screenshot self-test failed: the expected frames are not in file-name order')
  }

  runManifestSelfTest()
  selfTestReplaceCommitted()

  // The compact layout is a rewrite of JSON text, so it has to read back as
  // exactly what was written, quotes and backslashes in the copy included.
  const sample = {
    version: 1,
    frames: { ru: { '01-a': { image: 'h', nodes: [{ tag: 'b', text: 'say "hi" \\ 0x#', box: [1, 2, 3, 4], style: 's' }] } } },
  }
  const formatted = formatManifest(sample)
  if (JSON.stringify(JSON.parse(formatted)) !== JSON.stringify(sample)) {
    throw new Error('Screenshot self-test failed: the manifest does not read back as written')
  }
  if (!formatted.includes('{"tag":"b","text":"say \\"hi\\" \\\\ 0x#","box":[1,2,3,4],"style":"s"}')) {
    throw new Error('Screenshot self-test failed: a manifest element is not written on one line')
  }

  console.log('Screenshot self-test passed')
}

/** What the in-page fingerprint is told to mask, blur and read. */
const FINGERPRINT_OPTIONS = {
  liveSelectors: LIVE_SELECTORS,
  livePlaceholder: LIVE_PLACEHOLDER,
  secretSelectors: SECRET_SELECTORS,
  styleProperties: STYLE_PROPERTIES,
}

/**
 * Walks one locale through the workspace and hands every frame to `capture`.
 * The shooting run and the check both come through here, so they cannot
 * disagree about which state of the UI a frame is.
 */
async function walkLocale(page, url, lang, capture) {
  await page.goto(`${url}workspace`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  // Each shot is cropped to the panel it is about. A viewport-wide capture
  // dragged in the top of the following section, which rendered in the docs
  // as a clipped stray heading.
  const donorPanel = page.locator('.dw').first()

  // 1. Step one, before anything is generated: the fields are empty, so this
  //    frame cannot leak a key even in principle.
  await capture('01-donor-empty', donorPanel)

  // 2. Generate the donor, then the same panel with values — masked by the
  //    product and blurred by us.
  await page.getByRole('button', { name: labels[lang].create }).click()
  await page.waitForTimeout(1500)
  await capture('02-donor-created', donorPanel)

  // 3. Step two unlocks only after the backup is exported, which is the gate
  //    readers most often get stuck on.
  try {
    const download = page.waitForEvent('download', { timeout: 8000 })
    await page.getByRole('button', { name: labels[lang].export }).click()
    await download
  } catch {
    console.warn(`  ${lang}: backup export did not fire a download; step 2 may stay locked`)
  }
  await page.waitForTimeout(800)

  // Downloading is no longer the whole gate: the site asks the user to confirm
  // the file actually landed, and step two stays locked until that box is
  // ticked (`donor.exportConfirmHint`). Targeted by id rather than by label so
  // this does not need a fourth per-language string, and forced because the
  // native input sits behind a styled one.
  const exportAck = page.locator('#donor-export-confirm')
  if (!(await exportAck.count())) throw unreachable(lang, 'the export confirmation #donor-export-confirm is gone, so step 2 cannot unlock')
  await exportAck.check({ force: true })
  await page.waitForTimeout(600)

  const step2 = page.locator('.step-nav__btn', { hasText: labels[lang].step2 }).first()
  if (!(await step2.count())) throw unreachable(lang, `no step button reads "${labels[lang].step2}"`)
  await step2.click({ timeout: 5000 })
  await page.waitForTimeout(1800)
  // Guard the panel, not the nav button: the button exists whether or not
  // the step unlocked.
  const panel = page.locator('.action-selector__panel').first()
  if (!(await panel.count())) throw unreachable(lang, 'step 2 did not unlock')
  await capture('03-select-action', panel)

  // 4. The header on its own: network selector, block, gas price, and the
  //    six-step bar. Referenced wherever the text talks about picking a
  //    network or moving between steps.
  await capture('04-header', page.locator('.header').first())

  // 5. Custom TX Builder, one frame per transaction type. The path is taken
  //    from the components rather than guessed: the key form is hidden behind
  //    the Add Private Key button (CustomTxPanel.tsx `showAddForm`), and the
  //    type picker only appears after Add Transaction (CustomWalletItem.tsx).
  const action = page.getByText(labels[lang].customAction, { exact: false }).first()
  if (!(await action.count())) throw unreachable(lang, `no action reads "${labels[lang].customAction}"`)
  await action.click()
  await page.waitForTimeout(1800)

  await page.getByRole('button', { name: labels[lang].addKey }).first().click()
  await page.waitForTimeout(500)
  await page.locator('.cxp__add-input').first().fill(throwawayKey())
  await page.locator('.cxp__add-confirm').first().click()
  await page.waitForTimeout(1200)

  await page.getByRole('button', { name: labels[lang].addTx }).first().click()
  await page.waitForTimeout(900)

  // The picker itself: the four types side by side.
  await capture('05-tx-types', page.locator('.cwi__type-wrap').first())

  for (const [index, type] of TX_TYPES.entries()) {
    const chip = page.locator('.cwi__type-chip').nth(index)
    if (!(await chip.count())) throw unreachable(lang, `the type picker has no chip ${index + 1} for ${type}`)
    await chip.click()
    await page.waitForTimeout(1100)
    // The filled-in entry, showing exactly which fields this type asks for.
    await capture(txFrameName(index, type), page.locator('.cte').first())
    // Back to the picker for the next type. Without the removal the next
    // frame would still be this entry, shot under the next type's name.
    const removeButton = page.locator('.cte__remove').first()
    if (!(await removeButton.count())) throw unreachable(lang, `the ${type} entry has no remove button`)
    await removeButton.click()
    await page.waitForTimeout(700)
    await page.getByRole('button', { name: labels[lang].addTx }).first().click()
    await page.waitForTimeout(800)
  }
}

/**
 * Replaces every locale directory and then the manifest, and undoes the
 * replacement if any rename in it fails.
 *
 * The new set is copied next to the old one first (`swapRoot` must share a
 * filesystem with `outRoot`, so what follows is renames, not copies), then each
 * locale is swapped and the manifest renamed into place last. A failing rename
 * undoes the ones before it in reverse order. If the undo fails as well, the
 * work directory holding the previous set is kept and named in the error rather
 * than deleted with it. `rename` and `restore` are parameters only so the
 * self-test can make one of them fail.
 */
export function replaceCommitted({
  stagedRoot,
  outRoot,
  langs,
  manifestPath,
  manifestText,
  swapRoot,
  rename = renameSync,
  restore = renameSync,
}) {
  const work = mkdtempSync(join(swapRoot, 'screenshots-swap-'))
  let keepWork = false
  try {
    for (const lang of langs) cpSync(join(stagedRoot, lang), join(work, 'next', lang), { recursive: true })
    mkdirSync(join(work, 'old'))
    writeFileSync(join(work, 'manifest.json'), manifestText)

    const undo = []
    try {
      for (const lang of langs) {
        const current = join(outRoot, lang)
        const previous = join(work, 'old', lang)
        if (existsSync(current)) {
          rename(current, previous)
          undo.push(() => restore(previous, current))
        }
        rename(join(work, 'next', lang), current)
        undo.push(() => rmSync(current, { recursive: true, force: true }))
      }
      rename(join(work, 'manifest.json'), manifestPath)
    } catch (error) {
      const unrestored = []
      for (const step of undo.reverse()) {
        try {
          step()
        } catch (undoError) {
          unrestored.push(undoError.message)
        }
      }
      if (unrestored.length) {
        keepWork = true
        throw new Error(
          `${error.message}; putting the previous frames back also failed (${unrestored.join('; ')}). ` +
            `The previous set is kept in ${join(work, 'old')} — move it back by hand.`,
        )
      }
      throw error
    }
  } finally {
    if (!keepWork) rmSync(work, { recursive: true, force: true })
  }
}

/** Proves `replaceCommitted` leaves the old set intact whichever rename fails. */
function selfTestReplaceCommitted() {
  const root = mkdtempSync(join(tmpdir(), 'antidrain-screenshots-selftest-'))
  const read = (path) => readFileSync(path, 'utf8')
  const setUp = () => {
    rmSync(root, { recursive: true, force: true })
    for (const lang of LANGS) {
      mkdirSync(join(root, 'out', lang), { recursive: true })
      writeFileSync(join(root, 'out', lang, 'old.webp'), `old ${lang}`)
      mkdirSync(join(root, 'staged', lang), { recursive: true })
      writeFileSync(join(root, 'staged', lang, 'new.webp'), `new ${lang}`)
    }
    mkdirSync(join(root, 'swap'))
    writeFileSync(join(root, 'manifest.json'), 'old manifest')
  }
  const replace = (rename, restore = renameSync) =>
    replaceCommitted({
      stagedRoot: join(root, 'staged'),
      outRoot: join(root, 'out'),
      langs: LANGS,
      manifestPath: join(root, 'manifest.json'),
      manifestText: 'new manifest',
      swapRoot: join(root, 'swap'),
      rename,
      restore,
    })
  const state = () =>
    [...LANGS.map((lang) => readdirSync(join(root, 'out', lang)).join('+')), read(join(root, 'manifest.json')), readdirSync(join(root, 'swap')).length].join('|')

  try {
    setUp()
    replace(renameSync)
    if (state() !== 'new.webp|new.webp|new manifest|0') {
      throw new Error(`Screenshot self-test failed: a clean replacement left ${state()}`)
    }

    // Two locales make four locale renames and then the manifest: fail each in turn.
    for (let failAt = 1; failAt <= LANGS.length * 2 + 1; failAt += 1) {
      setUp()
      let calls = 0
      const failing = (from, to) => {
        calls += 1
        if (calls === failAt) throw new Error('injected rename failure')
        renameSync(from, to)
      }
      try {
        replace(failing)
        throw new Error(`Screenshot self-test failed: rename ${failAt} failed and the replacement reported success`)
      } catch (error) {
        if (error.message !== 'injected rename failure') throw error
      }
      if (state() !== 'old.webp|old.webp|old manifest|0') {
        throw new Error(`Screenshot self-test failed: a failure at rename ${failAt} left ${state()}`)
      }
    }

    // The undo failing too must not delete the only copy of the previous set.
    setUp()
    let forward = 0
    try {
      replace(
        (from, to) => {
          forward += 1
          if (forward === 3) throw new Error('injected rename failure')
          renameSync(from, to)
        },
        () => {
          throw new Error('injected restore failure')
        },
      )
      throw new Error('Screenshot self-test failed: a failed replacement with a failed undo reported success')
    } catch (error) {
      if (!error.message.includes('injected restore failure') || !error.message.includes('is kept in')) throw error
    }
    const [kept] = readdirSync(join(root, 'swap'))
    if (!kept || read(join(root, 'swap', kept, 'old', LANGS[0], 'old.webp')) !== `old ${LANGS[0]}`) {
      throw new Error('Screenshot self-test failed: a failed undo deleted the previous set it could not put back')
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

/** `{ lang: { fileName: sha256 } }` for every file in the committed locale directories. */
function readCommittedImages() {
  return Object.fromEntries(
    LANGS.map((lang) => {
      const dir = join(OUT_ROOT, lang)
      const files = existsSync(dir) ? readdirSync(dir) : []
      return [lang, Object.fromEntries(files.map((name) => [name, hashBytes(readFileSync(join(dir, name)))]))]
    }),
  )
}

function readManifest() {
  return existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : null
}

/**
 * One element per line. Pretty-printed JSON puts every field and every box
 * coordinate on its own line, which turns a refreshed frame into a diff
 * nobody reads.
 */
export function formatManifest(manifest) {
  const MARK = '\u0000'
  return `${JSON.stringify(
    manifest,
    (key, value) => (key === 'nodes' ? value.map((node) => `${MARK}${JSON.stringify(node)}`) : value),
    2,
  ).replace(/"\\u0000(?:[^"\\]|\\.)*"/gu, (quoted) => JSON.parse(quoted).slice(1))}\n`
}

/** Starts or reuses the site, opens a browser, and walks every locale. */
async function renderAll(staging) {
  const { chromium } = await import('playwright')

  let proc = null
  let url = SITE_URL
  if (url) {
    if (!url.endsWith('/')) url += '/'
    console.log(`reusing the site dev server at ${url}`)
  } else {
    console.log('starting site dev server…')
    ;({ proc, url } = await startSite())
    console.log(`site at ${url}`)
  }

  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : existsSync('/usr/bin/chromium-browser')
        ? { executablePath: '/usr/bin/chromium-browser' }
        : {},
  )

  const rendered = {}
  try {
    for (const lang of LANGS) {
      rendered[lang] = {}
      if (staging) mkdirSync(join(staging, lang), { recursive: true })

      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
        acceptDownloads: true,
      })
      // Language and mode are read from storage before first paint.
      await context.addInitScript(
        `try {
           localStorage.setItem('antidrain.lang', '${lang}')
           localStorage.setItem('antidrain.mode', 'simple')
         } catch {}`,
      )
      const page = await context.newPage()

      const capture = async (name, target) => {
        await blurSecrets(page)
        await page.evaluate(() => document.fonts.ready.then(() => undefined))
        if (staging) await target.screenshot({ path: join(staging, lang, `${name}.png`) })
        rendered[lang][name] = sealFrame(await target.evaluate(collectFingerprint, FINGERPRINT_OPTIONS), `${lang}/${name}`)
        console.log(`  ${lang}/${name}`)
      }

      await walkLocale(page, url, lang, capture)
      await context.close()
    }
  } finally {
    await browser.close()
    // Only tear down a server this script started.
    if (proc) {
      try {
        process.kill(-proc.pid, 'SIGTERM')
      } catch {
        proc.kill('SIGTERM')
      }
    }
  }

  const missing = missingFrames(rendered, EXPECTED_FRAMES, LANGS)
  if (missing.length) throw new Error(`frames not captured: ${missing.join(', ')}`)
  return rendered
}

/** Converts, budgets, and only then replaces the committed frames and their manifest. */
async function publish(staging, rendered) {
  // PNG straight out of the browser is far too heavy to commit.
  console.log('\noptimising…')
  const optimise = spawn('python3', [join(HERE, 'optimise-screenshots.py'), staging], { stdio: 'inherit' })
  await new Promise((done, fail) =>
    optimise.on('exit', (code) => (code === 0 ? done() : fail(new Error(`optimiser exited ${code}`)))),
  )

  const staged = LANGS.flatMap((lang) =>
    readdirSync(join(staging, lang)).map((name) => ({
      name: `${lang}/${name}`,
      kb: statSync(join(staging, lang, name)).size / 1024,
    })),
  )
  const { total, oversized, overTotal } = budgetFailures(staged, { maxFileKb: MAX_FILE_KB, maxTotalKb: MAX_TOTAL_KB })
  if (oversized.length || overTotal) {
    console.error('\nScreenshot budget exceeded; the committed frames were left as they were:')
    for (const o of oversized) console.error(`  ${o} (limit ${MAX_FILE_KB} KB)`)
    if (overTotal) console.error(`  total ${total.toFixed(0)} KB (limit ${MAX_TOTAL_KB} KB)`)
    process.exitCode = 1
    return
  }

  const stagedImages = Object.fromEntries(
    LANGS.map((lang) => [
      lang,
      Object.fromEntries(readdirSync(join(staging, lang)).map((name) => [name, hashBytes(readFileSync(join(staging, lang, name)))])),
    ]),
  )
  const manifest = {
    version: MANIFEST_VERSION,
    frames: Object.fromEntries(
      LANGS.map((lang) => [
        lang,
        Object.fromEntries(
          EXPECTED_FRAMES.map((name) => [name, { image: stagedImages[lang][`${name}.webp`], nodes: rendered[lang][name] }]),
        ),
      ]),
    ),
  }
  const stagedFailures = auditManifest({ manifest, images: stagedImages, rendered, expected: EXPECTED_FRAMES, langs: LANGS })
  if (stagedFailures.length) {
    throw new Error(`the frames just shot do not form a complete set; nothing was replaced:\n  ${stagedFailures.join('\n  ')}`)
  }

  mkdirSync(SWAP_ROOT, { recursive: true })
  replaceCommitted({
    stagedRoot: staging,
    outRoot: OUT_ROOT,
    langs: LANGS,
    manifestPath: MANIFEST_PATH,
    manifestText: formatManifest(manifest),
    swapRoot: SWAP_ROOT,
  })

  const images = readCommittedImages()
  const failures = auditManifest({ manifest, images, rendered, expected: EXPECTED_FRAMES, langs: LANGS })
  if (failures.length) throw new Error(`the manifest just written does not describe this run:\n  ${failures.join('\n  ')}`)

  console.log(`\n${staged.length} screenshot(s), ${total.toFixed(0)} KB total, and docs/.vitepress/screenshots/manifest.json.`)
  console.log('Open every frame before committing, and commit the images and the manifest together.')
}

function reportCheck(rendered) {
  const failures = auditManifest({
    manifest: readManifest(),
    images: readCommittedImages(),
    rendered,
    expected: EXPECTED_FRAMES,
    langs: LANGS,
  })
  if (failures.length) {
    console.error('\nThe committed screenshots no longer match the site:')
    for (const failure of failures) console.error(`  ${failure}`)
    console.error('\nRun npm run screenshots, open every frame, and commit the images with docs/.vitepress/screenshots/manifest.json.')
    process.exitCode = 1
    return
  }
  console.log(`\nAll ${EXPECTED_FRAMES.length * LANGS.length} committed frames still match what the site renders.`)
}

async function main() {
  if (process.argv.includes(SELF_TEST_FLAG)) {
    runSelfTest()
    return
  }

  if (!SITE_URL && !existsSync(join(SITE, 'package.json'))) {
    console.error(`site not found at ${SITE}.`)
    console.error('Set ANTIDRAIN_SITE, or set SITE_URL to a running dev server.')
    process.exitCode = 2
    return
  }

  assertLabelParity(labels, LANGS)

  if (process.argv.includes(CHECK_FLAG)) {
    if (!readManifest()) {
      console.error(`no manifest at ${MANIFEST_PATH}; run npm run screenshots first`)
      process.exitCode = 1
      return
    }
    reportCheck(await renderAll(null))
    return
  }

  const staging = mkdtempSync(join(tmpdir(), 'antidrain-screenshots-'))
  try {
    await publish(staging, await renderAll(staging))
  } finally {
    rmSync(staging, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
