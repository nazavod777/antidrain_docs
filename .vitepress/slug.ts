const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya"
};

function transliterateCharacter(character: string) {
  const lowerCharacter = character.toLowerCase();
  return CYRILLIC_TO_LATIN[lowerCharacter] ?? lowerCharacter;
}

export function slugifyHeading(value: string) {
  const transliterated = Array.from(value.normalize("NFKD"), transliterateCharacter).join("");

  return (
    transliterated
      .replace(/&/g, " and ")
      .replace(/['"`’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "section"
  );
}

/**
 * Legacy slug format used by pre-migration docs URLs.
 *
 * `use-docs-runtime-effects.ts` uses this helper to translate old deep links whose
 * hash fragments were generated before the ASCII-only slug policy was introduced.
 */
export function legacySlugifyHeading(value: string) {
  return (
    value
      .normalize("NFKD")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/['"`’]/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-") || "section"
  );
}
