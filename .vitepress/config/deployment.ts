import {
  DOCS_LOCALE_DEFINITIONS,
  buildAbsoluteUrl,
  resolveDocsOrigin,
  resolveMainSiteOrigin
} from "../../shared/docs-site-policy.mjs";

export const siteTitle = "AntiDrain Docs";
export const docsOrigin = resolveDocsOrigin();
export const mainSiteOrigin = resolveMainSiteOrigin();
export const socialImagePath = "/antidrain-preview.png";
export const socialImage = buildAbsoluteUrl(docsOrigin, socialImagePath);
export const localeDefinitions = DOCS_LOCALE_DEFINITIONS;

export function buildDocsUrl(pathname: string) {
  return buildAbsoluteUrl(docsOrigin, pathname);
}

