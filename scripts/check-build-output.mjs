import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDocsOrigin } from "../shared/docs-site-policy.mjs";

const siteOrigin = resolveDocsOrigin();
const distDir = fileURLToPath(new URL("../.vitepress/dist/", import.meta.url));
const assetsDir = path.join(distDir, "assets");

const redirectPages = [
  {
    filePath: path.join(distDir, "index.html"),
    target: "/getting-started",
    fallbackHref: "/getting-started",
    fallbackLabel: "Getting Started"
  },
  {
    filePath: path.join(distDir, "ru", "index.html"),
    target: "/ru/getting-started",
    fallbackHref: "/ru/getting-started",
    fallbackLabel: "С чего начать"
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

function parseAttributes(tagMarkup) {
  const attributes = {};

  for (const match of tagMarkup.matchAll(/([^\s=]+)="([^"]*)"/g)) {
    attributes[match[1]] = match[2];
  }

  return attributes;
}

function collectTags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "g"))].map((match) => ({
    raw: match[0],
    attributes: parseAttributes(match[0])
  }));
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

  if (/<script\b|modulepreload|__VP_HASH_MAP__|__VP_SITE_DATA__/i.test(html)) {
    fail(`Redirect stub ${page.filePath} still loads app bundles.`);
  }

  if (!html.includes(`href="${page.fallbackHref}"`) || !html.includes(page.fallbackLabel)) {
    fail(`Redirect stub ${page.filePath} is missing the visible fallback link.`);
  }
}

for (const redirectPage of redirectPages) {
  assertRedirectStub(redirectPage);
}

if (fs.existsSync(assetsDir)) {
  const redirectChunkArtifacts = fs.readdirSync(assetsDir).filter((entry) =>
    /^index\.md\.|^ru_index\.md\./u.test(entry)
  );

  if (redirectChunkArtifacts.length > 0) {
    fail(`Redirect stubs still produce VitePress page chunks: ${redirectChunkArtifacts.join(", ")}`);
  }
}

const sitemap = readText(path.join(distDir, "sitemap.xml"));
const robotsTxt = readText(path.join(distDir, "robots.txt"));

if (!/^Sitemap:\s*\/sitemap\.xml$/imu.test(robotsTxt)) {
  fail("robots.txt must publish a relative sitemap path.");
}

if (sitemap.includes(`<loc>${siteOrigin}/</loc>`)) {
  fail("Sitemap still contains the root redirect stub.");
}

if (sitemap.includes(`<loc>${siteOrigin}/ru/</loc>`)) {
  fail("Sitemap still contains the RU root redirect stub.");
}

const sitemapUrlBlocks = [...sitemap.matchAll(/<url>[\s\S]*?<\/url>/g)].map((match) => match[0]);

for (const urlBlock of sitemapUrlBlocks) {
  const locMatch = urlBlock.match(/<loc>([^<]+)<\/loc>/);

  if (!locMatch) {
    fail("Sitemap contains a <url> block without <loc>.");
  }

  if (!/<lastmod>[^<]+<\/lastmod>/i.test(urlBlock)) {
    fail(`Sitemap entry ${locMatch[1]} is missing <lastmod>.`);
  }

  if (/hreflang="en-US"|hreflang="ru-RU"/i.test(urlBlock) && !/hreflang="x-default"/i.test(urlBlock)) {
    fail(`Sitemap entry ${locMatch[1]} is missing the x-default hreflang.`);
  }
}

const htmlFiles = collectHtmlFiles(distDir);

for (const htmlFile of htmlFiles) {
  const html = readText(htmlFile);

  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(html)) {
    fail(`External Google webfonts are still referenced in ${htmlFile}`);
  }

  const iconStylesheetLinks = collectTags(html, "link")
    .map((tag) => tag.attributes)
    .filter((attributes) => typeof attributes.href === "string" && /\/vp-icons\.css$/i.test(attributes.href));

  if (iconStylesheetLinks.length > 0) {
    fail(`Empty vp-icons.css is still referenced in ${htmlFile}`);
  }

  if (htmlFile.endsWith(`${path.sep}404.html`) && !/name="robots"\s+content="noindex,\s*nofollow"/i.test(html)) {
    fail("404 page is missing the noindex robots meta.");
  }

  const alternateLinks = collectTags(html, "link")
    .map((tag) => tag.attributes)
    .filter((attributes) => attributes.rel === "alternate" && attributes.hreflang && attributes.href);

  const hasLocaleAlternate = alternateLinks.some((attributes) => attributes.hreflang !== "x-default");

  if (hasLocaleAlternate && !alternateLinks.some((attributes) => attributes.hreflang === "x-default")) {
    fail(`Alternate links in ${htmlFile} are missing x-default.`);
  }

  for (const attributes of alternateLinks) {
    const alternatePath = routeToDistHtmlPath(attributes.href);

    if (!fs.existsSync(alternatePath)) {
      fail(`Alternate link ${attributes.href} in ${htmlFile} points to a missing built page.`);
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
