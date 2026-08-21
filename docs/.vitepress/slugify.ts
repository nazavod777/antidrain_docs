/**
 * Heading slugs, transliterating Cyrillic to ASCII.
 *
 * This is the ONE copy. The GitBook build carried the same algorithm three
 * times over — in page-toc.js, search-polish.js and scripts/pretty-urls.js —
 * byte-identical by hand, so any edit to one silently broke anchors generated
 * by the others. It is also the reason existing Russian deep links are ASCII
 * (`/ru/quick-start/#bystryy-start`, not `#быстрый-старт`), so this must keep
 * producing exactly the same output or every shared link breaks.
 */

/** Transliteration table, carried over unchanged from page-toc.js. */
const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
  ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

/**
 * Converts heading text to an ASCII slug.
 *
 * @param value - Raw heading text, in either language.
 * @returns A lowercase ASCII slug, or an empty string if nothing survives.
 * @example
 * slugify('Быстрый старт') // 'bystryy-start'
 * slugify('Core Safety Rules') // 'core-safety-rules'
 */
export function slugify(value: string): string {
  const text = String(value ?? '').toLowerCase()
  let converted = ''

  for (const character of text) {
    converted += Object.prototype.hasOwnProperty.call(CYRILLIC_MAP, character)
      ? CYRILLIC_MAP[character]
      : character
  }

  // Strip combining marks so accented Latin collapses to plain ASCII.
  converted = converted.normalize('NFKD').replace(/[̀-ͯ]/g, '')

  return converted
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Disambiguates a slug that already exists on the page by appending `-2`,
 * `-3`, and so on — matching what GitBook emitted, so repeated headings keep
 * the anchors they had.
 *
 * @param baseSlug - Slug produced by {@link slugify}.
 * @param used - Slugs already taken on this page; mutated to record the result.
 * @returns The unique slug that was reserved.
 */
export function uniqueSlug(baseSlug: string, used: Set<string>): string {
  const slug = baseSlug || 'section'
  let candidate = slug
  let index = 2

  while (used.has(candidate)) {
    candidate = `${slug}-${index}`
    index += 1
  }

  used.add(candidate)
  return candidate
}
