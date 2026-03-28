import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteOrigin = "https://docs.antidrain.me";
const distDir = fileURLToPath(new URL("../.vitepress/dist/", import.meta.url));

const redirectPages = [
  {
    filePath: path.join(distDir, "index.html"),
    target: "/getting-started"
  },
  {
    filePath: path.join(distDir, "ru", "index.html"),
    target: "/ru/getting-started"
  }
];

const forbiddenRussianPageStrings = [
  "Main Navigation",
  "Sidebar Navigation",
  "extra navigation",
  "mobile navigation",
  "Permalink to",
  'title="Copy Code"',
  ">Pager<"
];

function fail(message) {
  throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function stripInlineScripts(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
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

function routeToDistHtmlPath(routeUrl) {
  const pathname = new URL(routeUrl, siteOrigin).pathname;

  if (pathname === "/") {
    return path.join(distDir, "index.html");
  }

  if (pathname.endsWith("/")) {
    return path.join(distDir, pathname.replace(/^\/+/, ""), "index.html");
  }

  const normalizedPath = pathname.replace(/^\/+/, "");
  return path.join(distDir, `${normalizedPath}.html`);
}

function assertRedirectStub(page) {
  const html = readText(page.filePath);

  if (!/name="robots"\s+content="noindex,\s*nofollow"/i.test(html)) {
    fail(`Missing noindex robots meta in ${page.filePath}`);
  }

  if (
    !new RegExp(
      `http-equiv="refresh"\\s+content="0;url=${page.target.replace(/\//g, "\\/")}"`,
      "i"
    ).test(html)
  ) {
    fail(`Missing meta refresh to ${page.target} in ${page.filePath}`);
  }
}

for (const redirectPage of redirectPages) {
  assertRedirectStub(redirectPage);
}

const sitemap = readText(path.join(distDir, "sitemap.xml"));

if (sitemap.includes("<loc>https://docs.antidrain.me/</loc>")) {
  fail("Sitemap still contains the root redirect stub.");
}

if (sitemap.includes("<loc>https://docs.antidrain.me/ru/</loc>")) {
  fail("Sitemap still contains the RU root redirect stub.");
}

const htmlFiles = collectHtmlFiles(distDir);

for (const htmlFile of htmlFiles) {
  const html = readText(htmlFile);

  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(html)) {
    fail(`External Google webfonts are still referenced in ${htmlFile}`);
  }

  const alternateMatches = html.matchAll(
    /<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="([^"]+)"/g
  );

  for (const match of alternateMatches) {
    const alternatePath = routeToDistHtmlPath(match[1]);

    if (!fs.existsSync(alternatePath)) {
      fail(`Alternate link ${match[1]} in ${htmlFile} points to a missing built page.`);
    }
  }
}

const russianHtmlFiles = collectHtmlFiles(path.join(distDir, "ru"));

for (const htmlFile of russianHtmlFiles) {
  const html = stripInlineScripts(readText(htmlFile));

  for (const forbiddenText of forbiddenRussianPageStrings) {
    if (html.includes(forbiddenText)) {
      fail(`Forbidden English docs UI string "${forbiddenText}" found in ${htmlFile}`);
    }
  }
}

console.log("docs-site build output checks passed");
