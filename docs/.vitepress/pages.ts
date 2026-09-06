/**
 * The one page list.
 *
 * Adding a page used to be three edits in config.ts that nothing verified, and
 * two more lists elsewhere that nobody remembered: scripts/check-urls.mjs kept
 * its own copy of the slugs, and scripts/check-layout.mjs kept its own copy of
 * the URLs. Three copies of one fact drift, and the failure is silent — a page
 * with no label renders `undefined` in the sidebar and gets no rewrite, so it
 * is not even built.
 *
 * This module is therefore the source: config.ts, check-urls.mjs,
 * check-layout.mjs and check-slugs.mjs all read it. It **imports nothing**, so
 * the .mjs scripts can pull it in under `--experimental-strip-types` the same
 * way check-slugs.mjs already pulls in slugify.ts.
 *
 * The assertion at the bottom runs on import. Nothing typechecks config.ts —
 * VitePress transpiles it and esbuild erases types without looking at them — so
 * a missing label is a runtime fact or it is nothing at all.
 */

/** The two content locales. The root locale holds only the language picker. */
export const LOCALES = ['ru', 'en'] as const

export type Locale = (typeof LOCALES)[number]

/** Page slugs in reading order, grouped the way the sidebar presents them. */
export const GROUPS = [
  { key: 'start', pages: ['', 'wallet-compromised', 'beginner-guide', 'prepare', 'quick-start'] },
  { key: 'safety', pages: ['safety', 'donor-wallet'] },
  { key: 'workflow', pages: ['workspace-flow', 'rescue-actions', 'simulation-funding-sending', 'asset-manager'] },
  { key: 'reference', pages: ['service-fees', 'affiliate'] },
  { key: 'help', pages: ['troubleshooting', 'faq', 'glossary'] },
] as const

/** Sidebar group headings and per-page labels, per locale. */
export const LABELS = {
  ru: {
    groups: {
      start: 'Начало',
      safety: 'Безопасность',
      workflow: 'Рабочий процесс',
      reference: 'Справочник',
      help: 'Помощь',
    },
    pages: {
      '': 'Что такое AntiDrain',
      'wallet-compromised': 'Как ваш кошелёк взломали',
      'beginner-guide': 'Если вы новичок и кошелёк под угрозой',
      prepare: 'Подготовка',
      'quick-start': 'Быстрый старт',
      safety: 'Главные правила безопасности',
      'donor-wallet': 'Кошелёк-донор',
      'workspace-flow': 'Рабочий процесс',
      'rescue-actions': 'Rescue-сценарии',
      'simulation-funding-sending': 'Симуляция, пополнение и отправка',
      'asset-manager': 'Управление активами донора',
      'service-fees': 'Комиссии сервиса',
      affiliate: 'Партнёрская ссылка',
      troubleshooting: 'Ошибки и решения',
      faq: 'FAQ',
      glossary: 'Словарь',
    },
  },
  en: {
    groups: {
      start: 'Getting started',
      safety: 'Safety',
      workflow: 'Workflow',
      reference: 'Reference',
      help: 'Help',
    },
    pages: {
      '': 'What AntiDrain Is',
      'wallet-compromised': 'How Your Wallet Was Compromised',
      'beginner-guide': 'If You Are New and Your Wallet Is at Risk',
      prepare: 'Before You Start',
      'quick-start': 'Quick Start',
      safety: 'Core Safety Rules',
      'donor-wallet': 'Donor Wallet',
      'workspace-flow': 'Workspace Flow',
      'rescue-actions': 'Rescue Actions',
      'simulation-funding-sending': 'Simulation, Funding, and Sending',
      'asset-manager': 'Donor Asset Manager',
      'service-fees': 'Service Fees',
      affiliate: 'Affiliate Link',
      troubleshooting: 'Troubleshooting',
      faq: 'FAQ',
      glossary: 'Glossary',
    },
  },
} as const

/** Every slug in reading order. `''` is the locale index page. */
export const PAGE_SLUGS: readonly string[] = GROUPS.flatMap((group) => [...group.pages])

/** Slugs that become their own directory. Excludes the locale index. */
export const CONTENT_PAGE_SLUGS: readonly string[] = PAGE_SLUGS.filter((slug) => slug !== '')

/**
 * The markdown file backing a slug, relative to `docs/`. The locale index is
 * authored as `<lang>/index.md`, everything else flat as `<lang>/<slug>.md`;
 * config.ts rewrites the flat sources into directories at build time.
 */
export const sourceFile = (lang: Locale, slug: string): string =>
  `${lang}/${slug === '' ? 'index' : slug}.md`

/** The URL the built site serves for a slug — always a directory URL. */
export const pageUrl = (lang: Locale, slug: string): string =>
  slug === '' ? `/${lang}/` : `/${lang}/${slug}/`

/**
 * Every page URL the site serves, root language picker included. The order is
 * root, then each locale in reading order.
 */
export const ALL_PAGE_URLS: readonly string[] = [
  '/',
  ...LOCALES.flatMap((lang) => PAGE_SLUGS.map((slug) => pageUrl(lang, slug))),
]

/**
 * Turns a path like `docs/ru/glossary.md` — or `ru/glossary.md`, or a bare
 * `/ru/glossary/` — into the URL that page is served at. Returns `null` for
 * anything that is not a page, because a change to the theme or to a script is
 * not localised to one URL and must not be answered with a one-page run.
 */
export const urlForPath = (input: string): string | null => {
  const path = input.trim().replace(/^\.\//, '').replace(/^\/+/, '')
  if (path === '' || path === '/') return '/'

  const md = /^(?:docs\/)?(ru|en)\/([a-z0-9-]+)\.md$/.exec(path)
  if (md) {
    const [, lang, name] = md
    const slug = name === 'index' ? '' : name
    return PAGE_SLUGS.includes(slug) ? pageUrl(lang as Locale, slug) : null
  }
  if (/^(?:docs\/)?index\.md$/.test(path)) return '/'

  const url = /^(ru|en)(?:\/([a-z0-9-]+))?\/?$/.exec(path)
  if (url) {
    const [, lang, name] = url
    const slug = name ?? ''
    return PAGE_SLUGS.includes(slug) ? pageUrl(lang as Locale, slug) : null
  }
  return null
}

/**
 * Fails the import if any page is missing a label in either locale, or if a
 * label survives a page that no longer exists.
 *
 * Both directions matter. A missing label renders `undefined` in the sidebar
 * and produces no rewrite, so the page 404s; a leftover label is a page someone
 * deleted from GROUPS and forgot here, and the next reader copies it as if it
 * were live.
 */
const assertEveryPageIsLabelled = (): void => {
  const problems: string[] = []
  const groupKeys = GROUPS.map((group) => group.key as string)

  for (const lang of LOCALES) {
    const labels = LABELS[lang] as { groups: Record<string, string>; pages: Record<string, string> }

    for (const key of groupKeys) {
      if (!labels.groups[key]) problems.push(`LABELS.${lang}.groups['${key}'] is missing`)
    }
    for (const key of Object.keys(labels.groups)) {
      if (!groupKeys.includes(key)) problems.push(`LABELS.${lang}.groups['${key}'] has no group in GROUPS`)
    }

    for (const slug of PAGE_SLUGS) {
      if (!labels.pages[slug]) {
        problems.push(`LABELS.${lang}.pages['${slug}'] is missing — the page would render as \`undefined\``)
      }
    }
    for (const slug of Object.keys(labels.pages)) {
      if (!PAGE_SLUGS.includes(slug)) problems.push(`LABELS.${lang}.pages['${slug}'] has no page in GROUPS`)
    }
  }

  const seen = new Set<string>()
  for (const slug of PAGE_SLUGS) {
    if (seen.has(slug)) problems.push(`GROUPS lists '${slug}' twice`)
    seen.add(slug)
  }

  if (problems.length) {
    throw new Error(
      `docs/.vitepress/pages.ts: the page list and its labels disagree.\n  ${problems.join('\n  ')}`,
    )
  }
}

assertEveryPageIsLabelled()
