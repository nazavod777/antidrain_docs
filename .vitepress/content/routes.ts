import {
  getDocsLocalizedPage,
  getDocsPageByRelativePath,
  getDocsPageByRoute
} from "../../shared/docs-site-manifest.mjs";

export function relativePathToRoute(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/");
  const page = getDocsPageByRelativePath(normalized);
  const locale = normalized.startsWith("ru/") ? "ru" : "en";
  return page ? getDocsLocalizedPage(page, locale).route : `/${normalized.replace(/\.md$/, "")}`;
}

export function routeToRelativePath(route: string) {
  const normalizedRoute = route.replace(/[?#].*$/u, "").replace(/\/+$/u, "") || "/";
  const page = getDocsPageByRoute(normalizedRoute);

  if (!page) {
    return null;
  }

  const locale = normalizedRoute.startsWith("/ru/") ? "ru" : "en";
  return getDocsLocalizedPage(page, locale).relativePath;
}

export function buildAlternateRoutes(relativePath: string) {
  const page = getDocsPageByRelativePath(relativePath.replace(/\\/g, "/"));

  if (!page) {
    return { en: null, ru: null, xDefault: null };
  }

  const en = page.locales.en.route;
  const ru = page.locales.ru.route;

  return {
    en,
    ru,
    xDefault: en
  };
}
