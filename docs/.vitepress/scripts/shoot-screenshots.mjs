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
 * Requires a site checkout with dependencies installed. Point ANTIDRAIN_SITE
 * at it, or keep it next to this repo. If a site dev server is already
 * running, pass SITE_URL and this reuses it instead of starting another.
 *
 * ANTIDRAIN_SITE2 and SITE2_URL are still honoured as the former names of these
 * variables, from when the site checkout had a different directory name.
 */
import { existsSync, mkdirSync, readdirSync, statSync, rmSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT_ROOT = resolve(HERE, '../../public/screenshots')
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
const throwawayKey = () =>
  '0x' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')

if (!SITE_URL && !existsSync(join(SITE, 'package.json'))) {
  console.error(`site not found at ${SITE}.`)
  console.error('Set ANTIDRAIN_SITE, or set SITE_URL to a running dev server.')
  process.exit(2)
}

const { chromium } = await import('playwright')

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

const written = []

try {
  for (const lang of LANGS) {
    const dir = join(OUT_ROOT, lang)
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })

    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 1,
      accept_downloads: true,
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

    const shoot = async (name, target) => {
      await blurSecrets(page)
      const file = join(dir, `${name}.png`)
      await (target ?? page).screenshot({ path: file })
      written.push(file)
      console.log(`  ${lang}/${name}.png`)
    }

    await page.goto(`${url}workspace`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)

    // Each shot is cropped to the panel it is about. A viewport-wide capture
    // dragged in the top of the following section, which rendered in the docs
    // as a clipped stray heading.
    const donorPanel = page.locator('.dw').first()

    // 1. Step one, before anything is generated: the fields are empty, so this
    //    frame cannot leak a key even in principle.
    await shoot('01-donor-empty', donorPanel)

    // 2. Generate the donor, then the same panel with values — masked by the
    //    product and blurred by us.
    await page.getByRole('button', { name: labels[lang].create }).click()
    await page.waitForTimeout(1500)
    await shoot('02-donor-created', donorPanel)

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
    if (await exportAck.count()) {
      await exportAck.check({ force: true }).catch(() => {})
      await page.waitForTimeout(600)
    } else {
      console.warn(`  ${lang}: export confirmation not found; step 2 may stay locked`)
    }

    const step2 = page.locator('.step-nav__btn', { hasText: labels[lang].step2 }).first()
    if (await step2.count()) {
      await step2.click({ timeout: 5000 }).catch(() => {})
      await page.waitForTimeout(1800)
      // Guard the panel, not the nav button: the button exists whether or not
      // the step unlocked, so waiting on it hid a locked step behind a 30s
      // timeout that killed the whole run — and each locale directory is wiped
      // before its first shot, so that failure left the repo with no images.
      const panel = page.locator('.action-selector__panel').first()
      if (await panel.count()) {
        await shoot('03-select-action', panel)
      } else {
        console.warn(`  ${lang}: step 2 did not unlock; skipping 03-select-action`)
      }
    }

    // 4. The header on its own: network selector, block, gas price, and the
    //    six-step bar. Referenced wherever the text talks about picking a
    //    network or moving between steps.
    await shoot('04-header', page.locator('.header').first())

    // 5. Custom TX Builder, one frame per transaction type. The path is taken
    //    from the components rather than guessed: the key form is hidden behind
    //    the Add Private Key button (CustomTxPanel.tsx `showAddForm`), and the
    //    type picker only appears after Add Transaction (CustomWalletItem.tsx).
    const action = page.getByText(labels[lang].customAction, { exact: false }).first()
    if (await action.count()) {
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
      await shoot('05-tx-types', page.locator('.cwi__type-wrap').first())

      for (const [index, type] of TX_TYPES.entries()) {
        const chip = page.locator('.cwi__type-chip').nth(index)
        if (!(await chip.count())) continue
        await chip.click()
        await page.waitForTimeout(1100)
        // The filled-in entry, showing exactly which fields this type asks for.
        await shoot(`0${6 + index}-tx-${type}`, page.locator('.cte').first())
        // Back to the picker for the next type.
        const removeButton = page.locator('.cte__remove').first()
        if (await removeButton.count()) {
          await removeButton.click()
          await page.waitForTimeout(700)
        }
        const addAgain = page.getByRole('button', { name: labels[lang].addTx }).first()
        if (await addAgain.count()) {
          await addAgain.click()
          await page.waitForTimeout(800)
        }
      }
    }
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

// Convert and enforce the budget. PNG straight out of the browser is far too
// heavy to commit.
console.log('\noptimising…')
const optimise = spawn('python3', [join(HERE, 'optimise-screenshots.py'), OUT_ROOT], {
  stdio: 'inherit',
})
await new Promise((done, fail) =>
  optimise.on('exit', (code) => (code === 0 ? done() : fail(new Error(`optimiser exited ${code}`)))),
)

let total = 0
const oversized = []
for (const lang of LANGS) {
  const dir = join(OUT_ROOT, lang)
  if (!existsSync(dir)) continue
  for (const name of readdirSync(dir)) {
    const kb = statSync(join(dir, name)).size / 1024
    total += kb
    if (kb > MAX_FILE_KB) oversized.push(`${lang}/${name} is ${kb.toFixed(0)} KB`)
  }
}

if (oversized.length || total > MAX_TOTAL_KB) {
  console.error('\nScreenshot budget exceeded:')
  for (const o of oversized) console.error(`  ${o} (limit ${MAX_FILE_KB} KB)`)
  if (total > MAX_TOTAL_KB) console.error(`  total ${total.toFixed(0)} KB (limit ${MAX_TOTAL_KB} KB)`)
  process.exit(1)
}

console.log(`\n${written.length} screenshot(s), ${total.toFixed(0)} KB total. Review them before committing.`)
