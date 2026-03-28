import fs from "node:fs";
import path from "node:path";
import { DOCS_ROOT, getMarkdownRelativePaths, resolveLocale, type Locale } from "./markdown-files";
import { getDocsLocalizedPage, getDocsPageByRelativePath } from "../../shared/docs-site-manifest.mjs";
import { relativePathToRoute } from "./routes";

export type PageMeta = {
  relativePath: string;
  locale: Locale;
  route: string;
  title: string;
  description: string;
};

type FrontmatterMeta = {
  title: string;
  description: string;
};

const pageMetaByRelativePath = new Map<string, PageMeta>();

function parseFrontmatter(source: string): FrontmatterMeta {
  if (!source.startsWith("---")) {
    return {
      title: "",
      description: ""
    };
  }

  const endIndex = source.indexOf("\n---", 3);

  if (endIndex === -1) {
    return {
      title: "",
      description: ""
    };
  }

  const frontmatterBlock = source.slice(4, endIndex).split(/\r?\n/u);
  const metadata: FrontmatterMeta = {
    title: "",
    description: ""
  };

  for (const line of frontmatterBlock) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.+)\s*$/u);

    if (!match) {
      continue;
    }

    const [, rawKey, rawValue] = match;
    const key = rawKey.trim();
    const value = rawValue.trim().replace(/^['"]|['"]$/gu, "");

    if (key === "title") {
      metadata.title = value;
    }

    if (key === "description") {
      metadata.description = value;
    }
  }

  return metadata;
}

function buildPageMeta(relativePath: string): PageMeta {
  const filePath = path.join(DOCS_ROOT, relativePath);
  const source = fs.readFileSync(filePath, "utf8");
  const frontmatter = parseFrontmatter(source);
  const locale = resolveLocale(relativePath);
  const page = getDocsPageByRelativePath(relativePath);
  const route = page ? getDocsLocalizedPage(page, locale).route : relativePathToRoute(relativePath);

  return {
    relativePath,
    locale,
    route,
    title: frontmatter.title,
    description: frontmatter.description
  };
}

for (const relativePath of getMarkdownRelativePaths()) {
  pageMetaByRelativePath.set(relativePath, buildPageMeta(relativePath));
}

export function getPageMeta(relativePath: string) {
  return pageMetaByRelativePath.get(relativePath.replace(/\\/g, "/")) ?? null;
}

export function getAllPageMeta() {
  return [...pageMetaByRelativePath.values()];
}
