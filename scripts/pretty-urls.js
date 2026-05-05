#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const bookDir = path.resolve(__dirname, '..', '_book');
const cyrillicMap = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya'
};

function walk(dir) {
  return fs.readdirSync(dir).reduce((files, name) => {
    const fullPath = path.join(dir, name);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) return files.concat(walk(fullPath));
    files.push(fullPath);
    return files;
  }, []);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function isExternalUrl(url) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(url);
}

function splitUrl(url) {
  const match = String(url).match(/^([^?#]*)([?#].*)?$/);
  return {
    pathname: match ? match[1] : url,
    suffix: match && match[2] ? match[2] : ''
  };
}

function toPrettyPath(pathname) {
  if (!/\.html$/i.test(pathname)) return pathname;
  if (/\/index\.html$/i.test(pathname)) return pathname.replace(/index\.html$/i, '');
  return pathname.replace(/\.html$/i, '/');
}

function addDepth(pathname) {
  if (!pathname) return pathname;
  if (pathname === '.') return '..';
  if (pathname === './') return '../';
  return '../' + pathname;
}

function rewriteUrl(url, addDirectoryDepth) {
  if (!url || url.charAt(0) === '#' || isExternalUrl(url)) return url;

  const parts = splitUrl(url);
  let pathname = toPrettyPath(parts.pathname);

  if (addDirectoryDepth) pathname = addDepth(pathname);

  return pathname + parts.suffix;
}

function rewriteHtml(content, addDirectoryDepth) {
  let next = rewriteHeadingAnchors(content);

  next = next.replace(/\b(href|src|data-path)=(['"])([^'"]+)\2/g, (match, attr, quote, url) => {
    return attr + '=' + quote + rewriteUrl(url, addDirectoryDepth) + quote;
  });

  if (addDirectoryDepth) {
    next = next.replace(/"basePath":"([^"]*)"/, (match, basePath) => {
      const adjusted = basePath === '.' ? '..' : basePath + '/..';
      return '"basePath":"' + adjusted + '"';
    });
  }

  return next;
}

function rewriteHeadingAnchors(content) {
  const usedIds = new Set();
  const aliases = new Map();
  let next = content.replace(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, body) => {
    const idMatch = attrs.match(/\sid=(['"])(.*?)\1/i);

    if (!idMatch) return match;

    const originalId = decodeHtmlEntities(idMatch[2]);
    if (!containsNonAscii(originalId)) {
      usedIds.add(originalId);
      return match;
    }

    const headingText = decodeHtmlEntities(stripTags(body));
    const nextId = uniqueSlug(slugify(headingText), usedIds);
    const nextAttrs = attrs.replace(idMatch[0], ' id="' + nextId + '"');

    aliases.set(originalId, nextId);
    aliases.set(idMatch[2], nextId);

    return '<h' + level + nextAttrs + '>' + body + '</h' + level + '>';
  });

  if (aliases.size === 0) return next;

  next = next.replace(/\bhref=(['"])(#[^'"]+)\1/g, (match, quote, url) => {
    const id = decodeHash(url);
    const nextId = aliases.get(id);

    return nextId ? 'href=' + quote + '#' + encodeURIComponent(nextId) + quote : match;
  });

  return next;
}

function uniqueSlug(baseSlug, usedIds) {
  const slug = baseSlug || 'section';
  let nextSlug = slug;
  let index = 2;

  while (usedIds.has(nextSlug)) {
    nextSlug = slug + '-' + index;
    index += 1;
  }

  usedIds.add(nextSlug);
  return nextSlug;
}

function slugify(value) {
  let converted = '';
  const text = String(value || '').toLowerCase();

  for (let index = 0; index < text.length; index += 1) {
    const character = text.charAt(index);
    converted += Object.prototype.hasOwnProperty.call(cyrillicMap, character)
      ? cyrillicMap[character]
      : character;
  }

  converted = converted.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  return converted
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function containsNonAscii(value) {
  return /[^\x00-\x7F]/.test(String(value || ''));
}

function stripTags(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ');
}

function decodeHash(hash) {
  const id = String(hash || '').replace(/^#/, '');

  try {
    return decodeHtmlEntities(decodeURIComponent(id));
  } catch (error) {
    return decodeHtmlEntities(id);
  }
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&#x([0-9a-f]+);/gi, (match, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (match, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function destinationForHtml(file) {
  if (path.basename(file) === 'index.html') return file;

  const relative = path.relative(bookDir, file);
  const parsed = path.parse(relative);
  return path.join(bookDir, parsed.dir, parsed.name, 'index.html');
}

function redirectTarget(from, to) {
  return path.relative(path.dirname(from), path.dirname(to)).split(path.sep).join('/') + '/';
}

function redirectHtml(target) {
  return '<!doctype html>\n'
    + '<html>\n'
    + '<head>\n'
    + '  <meta charset="utf-8">\n'
    + '  <meta http-equiv="refresh" content="0; url=' + target + '">\n'
    + '  <link rel="canonical" href="' + target + '">\n'
    + '  <script>location.replace(' + JSON.stringify(target) + ' + location.search + location.hash);</script>\n'
    + '</head>\n'
    + '<body>\n'
    + '  <a href="' + target + '">Redirecting</a>\n'
    + '</body>\n'
    + '</html>\n';
}

function rewriteSearchIndex() {
  const file = path.join(bookDir, 'search_index.json');
  if (!fs.existsSync(file)) return;

  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  fs.writeFileSync(file, JSON.stringify(rewriteJson(data)));
}

function rewriteTextReferences(value) {
  return value.replace(/((?:\.\.?\/)?(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+)\.html\b/g, (match) => {
    return rewriteUrl(match, false);
  });
}

function rewriteJson(value) {
  if (typeof value === 'string') return rewriteTextReferences(value);
  if (Array.isArray(value)) return value.map(rewriteJson);
  if (!value || typeof value !== 'object') return value;

  return Object.keys(value).reduce((next, key) => {
    next[rewriteTextReferences(key)] = rewriteJson(value[key]);
    return next;
  }, {});
}

function main() {
  if (!fs.existsSync(bookDir)) {
    throw new Error('Missing _book directory. Run gitbook build first.');
  }

  const htmlFiles = walk(bookDir).filter((file) => file.endsWith('.html'));

  htmlFiles.forEach((file) => {
    const destination = destinationForHtml(file);
    const moved = destination !== file;
    const content = fs.readFileSync(file, 'utf8');
    const rewritten = rewriteHtml(content, moved);

    ensureDir(path.dirname(destination));
    fs.writeFileSync(destination, rewritten);

    if (moved) {
      fs.writeFileSync(file, redirectHtml(redirectTarget(file, destination)));
    }
  });

  rewriteSearchIndex();
}

main();
