import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDocsOrigin } from "../shared/docs-site-policy.mjs";

const distDir = fileURLToPath(new URL("../.vitepress/dist/", import.meta.url));
const docsOrigin = resolveDocsOrigin();

function fail(message) {
  throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function collectHtmlFiles(currentDir, bucket = []) {
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const absolutePath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      collectHtmlFiles(absolutePath, bucket);
      continue;
    }

    if (entry.isFile() && absolutePath.endsWith(".html")) {
      bucket.push(absolutePath);
    }
  }

  return bucket;
}

function resolveRouteHtmlPath(pathname) {
  if (pathname === "/") {
    return path.join(distDir, "index.html");
  }

  if (pathname.endsWith("/")) {
    return path.join(distDir, pathname.replace(/^\/+/u, ""), "index.html");
  }

  return path.join(distDir, `${pathname.replace(/^\/+/u, "")}.html`);
}

function resolveCurrentPageUrl(filePath) {
  const relativePath = path.relative(distDir, filePath).replace(/\\/g, "/");

  if (relativePath === "index.html") {
    return new URL("/", `${docsOrigin}/`);
  }

  if (relativePath.endsWith("/index.html")) {
    return new URL(`/${relativePath.slice(0, -"/index.html".length)}/`, `${docsOrigin}/`);
  }

  return new URL(`/${relativePath.replace(/\.html$/u, "")}`, `${docsOrigin}/`);
}

function collectAnchorHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\shref="([^"]+)"/gu)].map((match) => match[1]);
}

function assertHashTarget(targetFilePath, hash, sourceFilePath, href) {
  const html = readText(targetFilePath);

  if (hash === "top") {
    return;
  }

  if (!html.includes(`id="${hash}"`)) {
    fail(`Broken hash target ${href} in ${sourceFilePath}: missing id "${hash}" in ${targetFilePath}`);
  }
}

for (const htmlFile of collectHtmlFiles(distDir)) {
  const html = readText(htmlFile);
  const pageUrl = resolveCurrentPageUrl(htmlFile);

  for (const href of collectAnchorHrefs(html)) {
    if (
      !href ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:") ||
      href.startsWith("http://") ||
      href.startsWith("https://")
    ) {
      continue;
    }

    const targetUrl = new URL(href, pageUrl);

    if (targetUrl.origin !== pageUrl.origin) {
      continue;
    }

    const targetFilePath = resolveRouteHtmlPath(targetUrl.pathname);

    if (!fs.existsSync(targetFilePath)) {
      fail(`Broken internal link ${href} in ${htmlFile}: missing ${targetFilePath}`);
    }

    if (targetUrl.hash) {
      assertHashTarget(targetFilePath, targetUrl.hash.slice(1), htmlFile, href);
    }
  }
}

console.log("docs-site link checks passed");
