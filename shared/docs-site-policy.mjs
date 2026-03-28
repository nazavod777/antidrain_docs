const DEFAULT_DOCS_ORIGIN = "https://docs.antidrain.me";
const DEFAULT_MAIN_SITE_ORIGIN = "https://antidrain.me";

export const DOCS_LOCALE_DEFINITIONS = Object.freeze({
  root: Object.freeze({
    key: "root",
    label: "English",
    pathPrefix: "",
    lang: "en-US",
    hreflang: "en",
    ogLocale: "en_US"
  }),
  ru: Object.freeze({
    key: "ru",
    label: "Русский",
    pathPrefix: "/ru",
    lang: "ru-RU",
    hreflang: "ru",
    ogLocale: "ru_RU"
  })
});

export const ROOT_REDIRECT_TARGETS = Object.freeze({
  "/": "/getting-started",
  "/ru": "/ru/getting-started"
});

function readEnvValue(env, ...keys) {
  for (const key of keys) {
    const value = env?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function sanitizeOrigin(candidate, fallback) {
  try {
    const nextOrigin = new URL(candidate).origin.replace(/\/+$/u, "");
    return nextOrigin || fallback;
  } catch {
    return fallback;
  }
}

export function resolveDocsOrigin(env = globalThis?.process?.env) {
  return sanitizeOrigin(
    readEnvValue(env, "ANTIDRAIN_DOCS_ORIGIN", "DOCS_SITE_ORIGIN"),
    DEFAULT_DOCS_ORIGIN
  );
}

export function resolveMainSiteOrigin(env = globalThis?.process?.env) {
  return sanitizeOrigin(
    readEnvValue(env, "ANTIDRAIN_MAIN_SITE_ORIGIN", "MAIN_SITE_ORIGIN"),
    DEFAULT_MAIN_SITE_ORIGIN
  );
}

export function buildAbsoluteUrl(origin, pathname) {
  return new URL(pathname, `${origin}/`).toString();
}

export function normalizeDocsPathname(pathname) {
  if (!pathname) {
    return "/";
  }

  const trimmed = pathname.replace(/\/+$/u, "");
  return trimmed || "/";
}

export function getRedirectTargetPathname(pathname) {
  const normalizedPath = normalizeDocsPathname(pathname);
  return ROOT_REDIRECT_TARGETS[normalizedPath] ?? null;
}

const ROOT_INDEX_PATH_PATTERN = /^\/(?:index)\.(?:html?|md)$/iu;
const LOCALE_INDEX_PATH_PATTERN = /^\/(.+)\/index\.(?:html?|md)$/iu;
const DIRECT_EXTENSION_PATH_PATTERN = /^(.*)\.(?:html?|md)$/iu;

export function getCleanDocsPath(pathname) {
  const normalizedPath = normalizeDocsPathname(pathname);

  if (ROOT_INDEX_PATH_PATTERN.test(normalizedPath)) {
    return getRedirectTargetPathname("/") ?? "/";
  }

  const localeIndexMatch = normalizedPath.match(LOCALE_INDEX_PATH_PATTERN);

  if (localeIndexMatch) {
    const route = localeIndexMatch[1]?.replace(/\/+$/u, "") ?? "";
    const cleanedRoute = route ? `/${route}` : "/";
    return getRedirectTargetPathname(cleanedRoute) ?? cleanedRoute;
  }

  const directExtensionMatch = normalizedPath.match(DIRECT_EXTENSION_PATH_PATTERN);

  if (!directExtensionMatch) {
    return null;
  }

  const route = directExtensionMatch[1]?.replace(/\/+$/u, "") ?? "";
  const cleanedRoute = route || "/";
  return getRedirectTargetPathname(cleanedRoute) ?? cleanedRoute;
}
