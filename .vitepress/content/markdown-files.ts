import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type Locale = "en" | "ru";

export const DOCS_ROOT = fileURLToPath(new URL("../../", import.meta.url));

const markdownRelativePaths = collectMarkdownRelativePaths(DOCS_ROOT);
const markdownRelativePathSet = new Set(markdownRelativePaths);

function collectMarkdownRelativePaths(rootDir: string) {
  const results: string[] = [];

  function walk(currentDir: string) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (
        entry.name === ".git" ||
        entry.name === ".vitepress" ||
        entry.name === "dist" ||
        entry.name === "node_modules"
      ) {
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

export function resolveLocale(relativePath: string): Locale {
  return relativePath.startsWith("ru/") ? "ru" : "en";
}

export function isGlossaryPage(relativePath: string) {
  return /(^|\/)glossary\.md$/u.test(relativePath);
}

export function hasMarkdownPage(relativePath: string) {
  return markdownRelativePathSet.has(relativePath.replace(/\\/g, "/"));
}

export function getMarkdownRelativePaths() {
  return [...markdownRelativePaths];
}

export function getMarkdownLastModified(relativePath: string) {
  const normalizedRelativePath = relativePath.replace(/\\/g, "/");

  if (!hasMarkdownPage(normalizedRelativePath)) {
    return null;
  }

  return fs.statSync(path.join(DOCS_ROOT, normalizedRelativePath)).mtime.toISOString();
}
