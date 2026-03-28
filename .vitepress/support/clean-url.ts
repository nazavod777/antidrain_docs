const ROOT_INDEX_PATH_PATTERN = /^\/(?:index)\.(?:html?|md)$/iu;
const LOCALE_INDEX_PATH_PATTERN = /^\/(.+)\/index\.(?:html?|md)$/iu;
const DIRECT_EXTENSION_PATH_PATTERN = /^(.*)\.(?:html?|md)$/iu;

function normalizeCandidatePath(pathname: string) {
  if (!pathname) {
    return "/";
  }

  const trimmed = pathname.replace(/\/+$/u, "");
  return trimmed || "/";
}

export function getCleanDocsPath(pathname: string) {
  const normalizedPath = normalizeCandidatePath(pathname);

  if (ROOT_INDEX_PATH_PATTERN.test(normalizedPath)) {
    return "/";
  }

  const localeIndexMatch = normalizedPath.match(LOCALE_INDEX_PATH_PATTERN);

  if (localeIndexMatch) {
    const route = localeIndexMatch[1]?.replace(/\/+$/u, "") ?? "";
    return route ? `/${route}` : "/";
  }

  const directExtensionMatch = normalizedPath.match(DIRECT_EXTENSION_PATH_PATTERN);

  if (!directExtensionMatch) {
    return null;
  }

  const route = directExtensionMatch[1]?.replace(/\/+$/u, "") ?? "";
  return route || "/";
}

