import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugifyHeading } from "./slug";

export type Locale = "en" | "ru";

export type GlossaryEntry = {
  title: string;
  summary: string;
  aliases?: string[];
};

const DOCS_ROOT = fileURLToPath(new URL("../", import.meta.url));

const REDIRECT_TARGETS = {
  "index.md": "/getting-started",
  "ru/index.md": "/ru/getting-started"
} as const satisfies Record<string, string>;

const GLOSSARY_FILES: Record<Locale, string> = {
  en: "glossary.md",
  ru: "ru/glossary.md"
};

const GLOSSARY_ALIAS_OVERRIDES: Record<Locale, Record<string, string[]>> = {
  en: {
    "MEV-protected or private RPC": [
      "MEV-protected RPC",
      "private RPC",
      "private or MEV-protected RPC"
    ],
    "Beta route": ["beta-route"],
    "Block explorer": ["block explorers"]
  },
  ru: {
    "MEV-protected или private RPC": [
      "MEV-protected RPC",
      "private RPC",
      "private / MEV-protected RPC",
      "MEV-protected / private RPC"
    ],
    "Эксплорер": [
      "блокчейн-эксплорер",
      "block explorer",
      "block explorers",
      "эксплореры"
    ],
    "Beta route": ["beta-route"]
  }
};

const markdownRelativePaths = collectMarkdownRelativePaths(DOCS_ROOT);
const markdownRelativePathSet = new Set(markdownRelativePaths);
const glossaryCache = new Map<Locale, GlossaryEntry[]>();
const glossaryEntriesBySlugCache = new Map<Locale, Map<string, GlossaryEntry>>();

function collectMarkdownRelativePaths(rootDir: string) {
  const results: string[] = [];

  function walk(currentDir: string) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name === ".vitepress" || entry.name === "node_modules") {
        continue;
      }

      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith(".md")) {
        continue;
      }

      results.push(path.relative(rootDir, absolutePath).replace(/\\/g, "/"));
    }
  }

  walk(rootDir);
  return results.sort((left, right) => left.localeCompare(right));
}

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

function parseGlossaryEntries(relativePath: string) {
  const filePath = path.join(DOCS_ROOT, relativePath);
  const source = fs.readFileSync(filePath, "utf8");
  const headingMatches = [...source.matchAll(/^##\s+(.+?)\s*$/gmu)];
  const entries: Array<Pick<GlossaryEntry, "title" | "summary">> = [];

  for (let index = 0; index < headingMatches.length; index += 1) {
    const match = headingMatches[index];
    const title = stripInlineMarkdown(match[1] || "");

    if (!title) {
      continue;
    }

    const bodyStart = (match.index ?? 0) + match[0].length;
    const nextMatch = headingMatches[index + 1];
    const bodyEnd = nextMatch?.index ?? source.length;
    const summary = extractGlossarySummary(source.slice(bodyStart, bodyEnd));

    entries.push({
      title,
      summary
    });
  }

  return entries;
}

export function resolveLocale(relativePath: string): Locale {
  return relativePath.startsWith("ru/") ? "ru" : "en";
}

export function isGlossaryPage(relativePath: string) {
  return /(^|\/)glossary\.md$/u.test(relativePath);
}

export function relativePathToRoute(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/");

  if (normalized === "index.md") {
    return "/";
  }

  if (normalized === "ru/index.md") {
    return "/ru/";
  }

  return `/${normalized.replace(/\.md$/, "")}`;
}

export function getRedirectTargetRoute(relativePath: string) {
  return REDIRECT_TARGETS[relativePath as keyof typeof REDIRECT_TARGETS] ?? null;
}

export function isRedirectStubRelativePath(relativePath: string) {
  return Boolean(getRedirectTargetRoute(relativePath));
}

export function hasMarkdownPage(relativePath: string) {
  return markdownRelativePathSet.has(relativePath.replace(/\\/g, "/"));
}

export function buildAlternateRoutes(relativePath: string) {
  if (isRedirectStubRelativePath(relativePath)) {
    return {
      en: null,
      ru: null,
      xDefault: null
    };
  }

  const baseRelativePath = relativePath.startsWith("ru/")
    ? relativePath.slice(3)
    : relativePath;

  const englishRelativePath = baseRelativePath;
  const russianRelativePath = `ru/${baseRelativePath}`;

  const en = hasMarkdownPage(englishRelativePath)
    ? relativePathToRoute(englishRelativePath)
    : null;
  const ru = hasMarkdownPage(russianRelativePath)
    ? relativePathToRoute(russianRelativePath)
    : null;

  return {
    en,
    ru,
    xDefault: en
  };
}

export function getGlossaryEntries(locale: Locale): GlossaryEntry[] {
  const cached = glossaryCache.get(locale);

  if (cached) {
    return cached;
  }

  const baseEntries = parseGlossaryEntries(GLOSSARY_FILES[locale]);
  const aliasesByTitle = GLOSSARY_ALIAS_OVERRIDES[locale];
  const entries = baseEntries.map((entry) => ({
    title: entry.title,
    summary: entry.summary,
    aliases: aliasesByTitle[entry.title] ?? []
  }));

  glossaryCache.set(locale, entries);
  return entries;
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
