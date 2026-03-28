import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDocsManifestRelativePaths } from "../shared/docs-site-manifest.mjs";

const docsRoot = fileURLToPath(new URL("../", import.meta.url));
const manifestRelativePaths = new Set(getDocsManifestRelativePaths());

function fail(message) {
  throw new Error(message);
}

function collectMarkdownFiles(currentDir, bucket = []) {
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
      collectMarkdownFiles(absolutePath, bucket);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      bucket.push(absolutePath);
    }
  }

  return bucket;
}

function parseFrontmatter(source) {
  if (!source.startsWith("---")) {
    return {};
  }

  const endIndex = source.indexOf("\n---", 3);

  if (endIndex === -1) {
    return {};
  }

  const frontmatter = {};

  for (const line of source.slice(4, endIndex).split(/\r?\n/u)) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.+)\s*$/u);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    frontmatter[key] = rawValue.trim().replace(/^['"]|['"]$/gu, "");
  }

  return frontmatter;
}

function extractFirstHeading(source) {
  const match = source.match(/^#\s+(.+?)\s*$/mu);
  return match ? match[1].trim() : "";
}

function extractGlossarySections(source) {
  const headingMatches = [...source.matchAll(/^##\s+(.+?)\s*$/gmu)];
  const sections = [];

  for (let index = 0; index < headingMatches.length; index += 1) {
    const match = headingMatches[index];
    const title = match[1]?.trim() || "";
    const bodyStart = (match.index ?? 0) + match[0].length;
    const nextMatch = headingMatches[index + 1];
    const bodyEnd = nextMatch?.index ?? source.length;
    const bodyWithoutAliases = source
      .slice(bodyStart, bodyEnd)
      .replace(/^\s*<!--\s*aliases:\s*[\s\S]*?\s*-->\s*/u, "");
    const summary = bodyWithoutAliases
      .trim()
      .split(/\r?\n\r?\n/u)[0]
      ?.replace(/`([^`]+)`/g, "$1")
      ?.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      ?.replace(/\*\*([^*]+)\*\*/g, "$1")
      ?.replace(/\*([^*]+)\*/g, "$1")
      ?.replace(/<[^>]+>/g, "")
      ?.trim() || "";

    sections.push({ title, summary });
  }

  return sections;
}

for (const filePath of collectMarkdownFiles(docsRoot)) {
  const relativePath = path.relative(docsRoot, filePath).replace(/\\/g, "/");
  const source = fs.readFileSync(filePath, "utf8");
  const frontmatter = parseFrontmatter(source);
  const heading = extractFirstHeading(source);
  const isManifestPage = manifestRelativePaths.has(relativePath);

  if (!frontmatter.title || !frontmatter.description) {
    fail(`Missing title or description frontmatter in ${relativePath}`);
  }

  if (!heading) {
    fail(`Missing H1 heading in ${relativePath}`);
  }

  if (heading !== frontmatter.title) {
    fail(`Frontmatter title and H1 diverge in ${relativePath}: "${frontmatter.title}" vs "${heading}"`);
  }

  if (!isManifestPage) {
    fail(`Markdown file ${relativePath} is not declared in the docs content manifest.`);
  }

  if (/glossary\.md$/u.test(relativePath)) {
    const seenTitles = new Set();

    for (const entry of extractGlossarySections(source)) {
      if (!entry.title) {
        fail(`Glossary section without title in ${relativePath}`);
      }

      const normalizedTitle = entry.title.toLowerCase();

      if (seenTitles.has(normalizedTitle)) {
        fail(`Duplicate glossary term "${entry.title}" in ${relativePath}`);
      }

      seenTitles.add(normalizedTitle);

      if (!entry.summary) {
        fail(`Glossary term "${entry.title}" in ${relativePath} is missing a summary paragraph.`);
      }
    }
  }
}

for (const relativePath of manifestRelativePaths) {
  const absolutePath = path.join(docsRoot, relativePath);

  if (!fs.existsSync(absolutePath)) {
    fail(`Manifest entry ${relativePath} points to a missing markdown file.`);
  }
}

console.log("docs-site content quality checks passed");
