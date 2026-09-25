/**
 * The screenshot manifest: what each committed frame showed, recorded so a later run can tell
 * whether the site still renders the same thing without comparing pixels.
 *
 * Pixels are the wrong signal here. Every frame carries the live block number and gas price and a
 * donor address generated per run, so two honest runs never produce the same bytes. What a reader
 * relies on is narrower and stable: the words on screen, the controls and their order, where they
 * sit, and the handful of styles that change what a control looks like. A fingerprint of exactly
 * that is recorded per frame by `npm run screenshots`, and `npm run screenshots:check` renders the
 * same flow again and compares.
 *
 * What it cannot see, and a person still has to: icons, images and pseudo-elements, and any style
 * outside `STYLE_PROPERTIES`. A green check means the frames still describe the site's text, layout
 * and palette; it does not mean nobody needs to look at them after a redesign.
 *
 * Secrets. Input values are never read. Text and placeholders inside a declared secret field are
 * replaced wholesale, every `0x` run is masked, and anything left that is shaped like key material —
 * a long bare hex run, or a mnemonic-length run of lowercase words — stops the run instead of being
 * recorded, and is not printed either. That is a refusal of the shapes a key takes on screen, not a
 * proof: a secret rendered in some other form would need its selector added to `SECRET_SELECTORS`.
 * All of it happens in `sealFrame`, before a fingerprint is stored, written or compared.
 */
import { createHash } from 'node:crypto'

export const MANIFEST_VERSION = 1

/** Values that change between two honest runs. Masked in the DOM before anything is measured. */
export const LIVE_SELECTORS = ['.net-stats__value']

/** A fixed stand-in for a live value, so its width does not move the elements beside it. */
export const LIVE_PLACEHOLDER = '0000000'

/**
 * The computed styles that change what a control looks like without moving it. Deliberately short:
 * each one added is a property a harmless refactor can trip, and a colour or a weight that changed
 * is the kind of drift a reader notices in a frame.
 */
export const STYLE_PROPERTIES = [
  'color',
  'background-color',
  'border-color',
  'border-width',
  'border-radius',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'padding',
  'gap',
  'display',
  'opacity',
]

/** How far an edge may move, in CSS pixels, before it counts. Subpixel layout rounds either way. */
export const GEOMETRY_TOLERANCE_PX = 1

/** How many differences one frame reports before it summarises the rest. */
const MAX_REPORTED_PER_FRAME = 8

const HEX_RUN = /0x[0-9a-fA-F]{4,}/gu
const BARE_HEX_RUN = /[0-9a-fA-F]{32,}/u
const MNEMONIC_SHAPE = /^(?:[a-z]{3,8} ){11,23}[a-z]{3,8}$/u

/** What `maskText` returns for text it will not record. Never written anywhere. */
export const UNRECOGNISED_SECRET = Symbol('unrecognised secret')

/** Pure: one run of visible text as the manifest records it, or `UNRECOGNISED_SECRET`. */
export function maskText(text) {
  const flat = text.replace(/\s+/gu, ' ').trim()
  if (MNEMONIC_SHAPE.test(flat)) return UNRECOGNISED_SECRET
  const masked = flat.replace(HEX_RUN, '0x#')
  return BARE_HEX_RUN.test(masked) ? UNRECOGNISED_SECRET : masked
}

/**
 * Pure: the page's raw capture turned into what may be stored. Throws, without quoting the text, on
 * anything shaped like key material outside a declared secret field.
 */
export function sealFrame(rawNodes, frameLabel) {
  return rawNodes.map(({ tag, role, rawText, secret, box, style }) => {
    const flat = rawText.replace(/\s+/gu, ' ').trim()
    let text
    if (flat && secret) {
      text = '[secret]'
    } else if (flat) {
      text = maskText(flat)
      if (text === UNRECOGNISED_SECRET) {
        throw new Error(
          `${frameLabel}: a <${tag}> shows text shaped like key material outside the declared secret fields. ` +
            'It was not recorded or printed; add its selector to SECRET_SELECTORS in shoot-screenshots.mjs.',
        )
      }
    }
    return { tag, role, text: text || undefined, box, style }
  })
}

/**
 * Runs in the page, as `locator.evaluate(collectFingerprint, options)`, so it may use nothing from
 * this module's scope. Returns the frame's significant elements in document order, with their text
 * raw and a flag for a declared secret field: masking is `sealFrame`'s, so it has one implementation
 * and a self-test rather than a copy here that nothing can test.
 *
 * An element is significant when it carries its own text, is something a reader can operate, or
 * paints a surface (a background, a border, a shadow). Pure layout wrappers are left out: they are
 * where a refactor moves things around without changing the picture.
 */
export function collectFingerprint(root, options) {
  const { liveSelectors, livePlaceholder, secretSelectors, styleProperties } = options
  const doc = root.ownerDocument
  const masked = []

  // Text nodes are masked in place rather than replaced, so React keeps the nodes it owns.
  for (const selector of liveSelectors) {
    for (const element of doc.querySelectorAll(selector)) {
      const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.nodeValue.trim()) continue
        masked.push([node, node.nodeValue])
        node.nodeValue = livePlaceholder
      }
    }
  }

  const secret = secretSelectors.join(',')
  const operable = 'a,button,input,select,textarea,summary,label,img,svg,[role],[tabindex]'

  try {
    const origin = root.getBoundingClientRect()
    const nodes = []
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)

    for (let element = root; element; element = walker.nextNode()) {
      const box = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      if (box.width === 0 || box.height === 0 || style.visibility !== 'visible') continue

      const ownText = [...element.childNodes]
        .filter((child) => child.nodeType === Node.TEXT_NODE)
        .map((child) => child.nodeValue)
        .join(' ')
      const placeholder = element.getAttribute('placeholder') ?? ''
      const paints =
        style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
        style.borderTopWidth !== '0px' ||
        style.boxShadow !== 'none'
      const isOperable = element.matches(operable)

      if (element !== root && !ownText.trim() && !placeholder && !isOperable && !paints) continue

      nodes.push({
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute('role') ?? undefined,
        rawText: `${ownText} ${placeholder}`,
        secret: secret !== '' && element.closest(secret) !== null,
        box: [
          Math.round(box.left - origin.left),
          Math.round(box.top - origin.top),
          Math.round(box.width),
          Math.round(box.height),
        ],
        // Must match STYLE_SEPARATOR; this function cannot reach module scope.
        style: styleProperties.map((property) => style.getPropertyValue(property)).join(' | '),
      })
    }

    return nodes
  } finally {
    for (const [node, value] of masked) node.nodeValue = value
  }
}

/** Pure: sha256 of a file's bytes, as the manifest records it. */
export function hashBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

/** Pure: the frames a run was expected to produce and did not, as `lang/name`. */
export function missingFrames(captured, expected, langs) {
  return langs.flatMap((lang) =>
    expected.filter((name) => !captured[lang]?.[name]).map((name) => `${lang}/${name}`),
  )
}

const describe = (node) => `<${node.tag}${node.role ? ` role=${node.role}` : ''}>${node.text ? ` "${node.text}"` : ''}`

const boxMoved = (left, right) =>
  left.some((value, index) => Math.abs(value - right[index]) > GEOMETRY_TOLERANCE_PX)

const STYLE_SEPARATOR = ' | '

/**
 * Pure: the properties that differ between two recorded style strings, named. A whole string
 * printed twice hides the one value that moved among thirteen.
 */
export function styleChanges(before, after) {
  const left = before.split(STYLE_SEPARATOR)
  const right = after.split(STYLE_SEPARATOR)
  if (left.length !== STYLE_PROPERTIES.length || right.length !== STYLE_PROPERTIES.length) {
    return [`style ${before} -> ${after}`]
  }
  return STYLE_PROPERTIES.flatMap((property, index) =>
    left[index] === right[index] ? [] : [`${property} ${left[index]} -> ${right[index]}`],
  )
}

/** Pure: what changed between two fingerprints of one frame, most readable first. */
export function compareFrame(expected, actual) {
  const notes = []
  const expectedText = expected.map((node) => node.text).filter(Boolean)
  const actualText = actual.map((node) => node.text).filter(Boolean)

  for (const text of expectedText.filter((text) => !actualText.includes(text))) {
    notes.push(`text gone: "${text}"`)
  }
  for (const text of actualText.filter((text) => !expectedText.includes(text))) {
    notes.push(`text new: "${text}"`)
  }

  if (expected.length !== actual.length) {
    notes.push(`element count ${expected.length} -> ${actual.length}`)
  }

  const shared = Math.min(expected.length, actual.length)
  for (let index = 0; index < shared; index += 1) {
    const before = expected[index]
    const after = actual[index]
    if (before.tag !== after.tag || before.role !== after.role) {
      notes.push(`#${index} ${describe(before)} became ${describe(after)}`)
      continue
    }
    if (boxMoved(before.box, after.box)) {
      notes.push(`#${index} ${describe(after)} box [${before.box}] -> [${after.box}]`)
    }
    if (before.style !== after.style) {
      notes.push(`#${index} ${describe(after)} ${styleChanges(before.style, after.style).join(', ')}`)
    }
  }

  if (notes.length > MAX_REPORTED_PER_FRAME) {
    return [...notes.slice(0, MAX_REPORTED_PER_FRAME), `…and ${notes.length - MAX_REPORTED_PER_FRAME} more`]
  }
  return notes
}

/**
 * Pure: every way the committed frames disagree with the manifest and with the site as rendered now.
 *
 * `images` is `{ lang: { fileName: sha256 } }` for what is on disk; `rendered` is the fingerprints
 * of the run just made, or `null` when only the files are being compared.
 */
export function auditManifest({ manifest, images, rendered, expected, langs }) {
  if (!manifest || manifest.version !== MANIFEST_VERSION) {
    return [`the manifest is missing or not version ${MANIFEST_VERSION}; run npm run screenshots`]
  }

  const failures = []
  for (const lang of langs) {
    const wanted = expected.map((name) => `${name}.webp`).sort()
    const onDisk = Object.keys(images[lang] ?? {}).sort()
    if (wanted.join('|') !== onDisk.join('|')) {
      failures.push(`${lang}: files on disk are [${onDisk.join(', ')}], expected [${wanted.join(', ')}]`)
    }

    for (const name of expected) {
      const recorded = manifest.frames?.[lang]?.[name]
      if (!recorded) {
        failures.push(`${lang}/${name}: not in the manifest`)
        continue
      }
      const actualHash = images[lang]?.[`${name}.webp`]
      if (actualHash && actualHash !== recorded.image) {
        failures.push(`${lang}/${name}.webp: does not match the manifest — the image and the manifest were committed apart`)
      }
      const current = rendered?.[lang]?.[name]
      if (current) {
        for (const note of compareFrame(recorded.nodes, current)) failures.push(`${lang}/${name}: ${note}`)
      }
    }
  }
  return failures
}

function expectNotes(notes, fragment, description) {
  if (!notes.some((note) => note.includes(fragment))) {
    throw new Error(`Screenshot manifest self-test failed: ${description} reported ${JSON.stringify(notes)}`)
  }
}

/** Proves each rule above can fail. Pure, so it belongs in the fast loop. */
export function runManifestSelfTest() {
  if (maskText('Donor  0xAbCdEf0123456789\nready') !== 'Donor 0x# ready') {
    throw new Error('Screenshot manifest self-test failed: a hex run or whitespace survived masking')
  }
  if (maskText('0x1') !== '0x1') {
    throw new Error('Screenshot manifest self-test failed: a short literal like 0x1 was masked as a value')
  }

  const mnemonic = 'abandon ability able about above absent absorb abstract absurd abuse access accident'
  const bareKey = 'f'.repeat(24) + '0123456789abcdef'.repeat(2) + 'e'.repeat(8)
  if (maskText(mnemonic) !== UNRECOGNISED_SECRET || maskText(`key ${bareKey}`) !== UNRECOGNISED_SECRET) {
    throw new Error('Screenshot manifest self-test failed: a mnemonic or a bare hex key was accepted as copy')
  }
  if (maskText('Generate or import a donor wallet first and then come back here to continue') === UNRECOGNISED_SECRET) {
    throw new Error('Screenshot manifest self-test failed: a sentence of copy was refused as key material')
  }

  const raw = (overrides) => ({ tag: 'span', rawText: '', secret: false, box: [0, 0, 1, 1], style: 's', ...overrides })
  const sealed = sealFrame(
    [raw({ rawText: ` ${mnemonic} `, secret: true }), raw({ rawText: ' Enter your phrase', secret: true }), raw({ secret: true })],
    'ru/probe',
  )
  if (sealed.map((node) => node.text ?? '-').join(',') !== '[secret],[secret],-') {
    throw new Error(`Screenshot manifest self-test failed: a declared secret field sealed as ${JSON.stringify(sealed)}`)
  }
  try {
    sealFrame([raw({ rawText: mnemonic })], 'ru/probe')
    throw new Error('Screenshot manifest self-test failed: a mnemonic outside a secret field was sealed')
  } catch (error) {
    if (!error.message.includes('ru/probe: a <span> shows text shaped like key material')) throw error
    if (error.message.includes('abandon')) {
      throw new Error('Screenshot manifest self-test failed: the refusal quoted the text it refused')
    }
  }

  if (!collectFingerprint.toString().includes(`join('${STYLE_SEPARATOR}')`)) {
    throw new Error('Screenshot manifest self-test failed: the page joins styles with another separator than styleChanges splits on')
  }

  const styleOf = (backgroundColor) =>
    STYLE_PROPERTIES.map((property) => (property === 'background-color' ? backgroundColor : '0')).join(STYLE_SEPARATOR)
  const node = (overrides) => ({ tag: 'button', text: 'Generate Wallet', box: [0, 0, 120, 44], style: styleOf('red'), ...overrides })
  const frame = [node({}), node({ tag: 'span', text: 'Donor Wallet', box: [0, 50, 200, 20] })]

  if (compareFrame(frame, structuredClone(frame)).length !== 0) {
    throw new Error('Screenshot manifest self-test failed: an identical frame reported a difference')
  }
  if (compareFrame(frame, [node({ box: [1, 0, 121, 44] }), frame[1]]).length !== 0) {
    throw new Error('Screenshot manifest self-test failed: a one-pixel subpixel shift counted as drift')
  }
  expectNotes(compareFrame(frame, [node({ text: 'Create Wallet' }), frame[1]]), 'text gone: "Generate Wallet"', 'a renamed button')
  expectNotes(compareFrame(frame, [node({ box: [0, 0, 160, 44] }), frame[1]]), 'box [0,0,120,44] -> [0,0,160,44]', 'a wider button')
  const recoloured = compareFrame(frame, [node({ style: styleOf('blue') }), frame[1]])
  expectNotes(recoloured, 'background-color red -> blue', 'a recoloured button')
  if (recoloured.some((note) => note.includes('color 0 ->'))) {
    throw new Error('Screenshot manifest self-test failed: an unchanged property was reported as changed')
  }
  expectNotes(compareFrame(frame, [node({ style: 'legacy' }), frame[1]]), 'style ', 'a style string of another shape')
  expectNotes(compareFrame(frame, [frame[0]]), 'element count 2 -> 1', 'an element that disappeared')
  expectNotes(
    compareFrame(frame, [node({ tag: 'a' }), frame[1]]),
    'became <a>',
    'a button that became a link',
  )

  const many = Array.from({ length: 20 }, (_, index) => node({ text: `t${index}` }))
  const capped = compareFrame(many, many.map((entry) => ({ ...entry, style: styleOf('blue') })))
  expectNotes(capped, '…and 12 more', 'a frame with more differences than the report shows')

  const expected = ['01-a']
  const langs = ['ru']
  const manifest = { version: MANIFEST_VERSION, frames: { ru: { '01-a': { image: 'h1', nodes: frame } } } }
  const clean = auditManifest({ manifest, images: { ru: { '01-a.webp': 'h1' } }, rendered: { ru: { '01-a': frame } }, expected, langs })
  if (clean.length !== 0) {
    throw new Error(`Screenshot manifest self-test failed: a matching set reported ${JSON.stringify(clean)}`)
  }
  expectNotes(
    auditManifest({ manifest, images: { ru: { '01-a.webp': 'h2' } }, rendered: null, expected, langs }),
    'committed apart',
    'an image replaced without its manifest entry',
  )
  expectNotes(
    auditManifest({ manifest, images: { ru: { '01-a.webp': 'h1', 'stray.webp': 'h3' } }, rendered: null, expected, langs }),
    'files on disk are',
    'a stray image beside the expected set',
  )
  expectNotes(
    auditManifest({ manifest: null, images: {}, rendered: null, expected, langs }),
    'run npm run screenshots',
    'a missing manifest',
  )
  expectNotes(
    auditManifest({ manifest, images: { ru: { '01-a.webp': 'h1' } }, rendered: { ru: { '01-a': [node({ text: 'Create Wallet' }), frame[1]] } }, expected, langs }),
    'ru/01-a: text gone',
    'a frame the site now renders differently',
  )

  const missing = missingFrames({ ru: { '01-a': frame } }, ['01-a', '02-b'], ['ru', 'en'])
  if (missing.join(',') !== 'ru/02-b,en/01-a,en/02-b') {
    throw new Error(`Screenshot manifest self-test failed: missing frames were ${missing.join(',')}`)
  }
}
