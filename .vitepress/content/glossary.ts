import fs from "node:fs";
import path from "node:path";
import { DOCS_ROOT, type Locale } from "./markdown-files";
import { slugifyHeading } from "../slug";

export type GlossaryEntry = {
  title: string;
  summary: string;
  aliases?: string[];
};

export type GlossaryMatcher = {
  href: string;
  needle: string;
  needleLower: string;
  summary: string;
};

const GLOSSARY_FILES: Record<Locale, string> = {
  en: "glossary.md",
  ru: "ru/glossary.md"
};

const glossaryCache = new Map<Locale, GlossaryEntry[]>();
const glossaryEntriesBySlugCache = new Map<Locale, Map<string, GlossaryEntry>>();
const glossaryMatcherCache = new Map<Locale, GlossaryMatcher[]>();

function stripInlineMarkdown(value: string) {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function extractGlossarySummary(sectionBody: string) {
  const lines = sectionBody.split(/\r?\n/u);
  const paragraphLines: string[] = [];
  let isInsideCodeFence = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("```")) {
      isInsideCodeFence = !isInsideCodeFence;
      continue;
    }

    if (isInsideCodeFence) {
      continue;
    }

    if (!trimmedLine) {
      if (paragraphLines.length) {
        break;
      }
      continue;
    }

    if (
      trimmedLine.startsWith("- ") ||
      trimmedLine.startsWith("* ") ||
      /^\d+\.\s/u.test(trimmedLine) ||
      trimmedLine.startsWith(">") ||
      trimmedLine.startsWith("|")
    ) {
      if (paragraphLines.length) {
        break;
      }
      continue;
    }

    paragraphLines.push(trimmedLine);
  }

  return stripInlineMarkdown(paragraphLines.join(" ")).replace(/\s+/gu, " ").trim();
}

function extractGlossaryAliases(sectionBody: string) {
  const match = sectionBody.match(/^\s*<!--\s*aliases:\s*([\s\S]*?)\s*-->\s*/u);

  if (!match) {
    return {
      aliases: [] as string[],
      bodyWithoutAliases: sectionBody
    };
  }

  const aliases = match[1]
    .split("|")
    .map((value) => stripInlineMarkdown(value).trim())
    .filter(Boolean);

  return {
    aliases,
    bodyWithoutAliases: sectionBody.slice(match[0].length)
  };
}

function parseGlossaryEntries(relativePath: string) {
  const filePath = path.join(DOCS_ROOT, relativePath);
  const source = fs.readFileSync(filePath, "utf8");
  const headingMatches = [...source.matchAll(/^##\s+(.+?)\s*$/gmu)];
  const entries: GlossaryEntry[] = [];

  for (let index = 0; index < headingMatches.length; index += 1) {
    const match = headingMatches[index];
    const title = stripInlineMarkdown(match[1] || "");

    if (!title) {
      continue;
    }

    const bodyStart = (match.index ?? 0) + match[0].length;
    const nextMatch = headingMatches[index + 1];
    const bodyEnd = nextMatch?.index ?? source.length;
    const sectionBody = source.slice(bodyStart, bodyEnd);
    const { aliases, bodyWithoutAliases } = extractGlossaryAliases(sectionBody);
    const summary = extractGlossarySummary(bodyWithoutAliases);

    entries.push({
      title,
      summary,
      aliases
    });
  }

  return entries;
}

export function getGlossaryEntries(locale: Locale): GlossaryEntry[] {
  const cached = glossaryCache.get(locale);

  if (cached) {
    return cached;
  }

  const baseEntries = parseGlossaryEntries(GLOSSARY_FILES[locale]);
  const entries = baseEntries.map((entry) => ({
    title: entry.title,
    summary: entry.summary,
    aliases: entry.aliases ?? []
  }));

  glossaryCache.set(locale, entries);
  return entries;
}

export function getGlossaryMatchers(locale: Locale): GlossaryMatcher[] {
  const cached = glossaryMatcherCache.get(locale);

  if (cached) {
    return cached;
  }

  const dedupedMatchers = new Map<string, GlossaryMatcher>();

  for (const entry of getGlossaryEntries(locale)) {
    const href = buildGlossaryHref(locale, entry.title);
    const labels = [entry.title, ...(entry.aliases ?? [])];

    for (const label of labels) {
      const normalized = label.trim();
      const needleLower = normalized.toLowerCase();

      if (!needleLower || dedupedMatchers.has(needleLower)) {
        continue;
      }

      dedupedMatchers.set(needleLower, {
        href,
        needle: normalized,
        needleLower,
        summary: entry.summary
      });
    }
  }

  const matchers = [...dedupedMatchers.values()].sort(
    (left, right) => right.needleLower.length - left.needleLower.length
  );

  glossaryMatcherCache.set(locale, matchers);
  return matchers;
}

export function buildGlossaryHref(locale: Locale, title: string) {
  const baseRoute = locale === "ru" ? "/ru/glossary" : "/glossary";
  return `${baseRoute}#${slugifyHeading(title)}`;
}

function normalizeGlossaryHrefPath(hrefPath: string) {
  return hrefPath
    .trim()
    .replace(/^[.]+\/?/u, "")
    .replace(/^\/+/u, "")
    .replace(/\/+$/u, "");
}

function buildGlossaryEntriesBySlug(locale: Locale) {
  const cached = glossaryEntriesBySlugCache.get(locale);

  if (cached) {
    return cached;
  }

  const entriesBySlug = new Map<string, GlossaryEntry>();

  for (const entry of getGlossaryEntries(locale)) {
    entriesBySlug.set(slugifyHeading(entry.title), entry);
  }

  glossaryEntriesBySlugCache.set(locale, entriesBySlug);
  return entriesBySlug;
}

export function findGlossaryEntryByHref(locale: Locale, href: string) {
  if (!href) {
    return null;
  }

  const hashIndex = href.indexOf("#");

  if (hashIndex === -1) {
    return null;
  }

  const normalizedPath = normalizeGlossaryHrefPath(href.slice(0, hashIndex));
  const slug = href.slice(hashIndex + 1).trim();

  if (!slug) {
    return null;
  }

  const allowedPaths =
    locale === "ru"
      ? new Set(["glossary", "ru/glossary"])
      : new Set(["glossary"]);

  if (normalizedPath && !allowedPaths.has(normalizedPath)) {
    return null;
  }

  return buildGlossaryEntriesBySlug(locale).get(slug) ?? null;
}
