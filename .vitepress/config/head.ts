import type { HeadConfig } from "vitepress";
import {
  buildAlternateRoutes,
  getPageMeta,
  getMarkdownLastModified,
  relativePathToRoute,
  routeToRelativePath
} from "../content-data";
import { buildDocsUrl, docsOrigin, localeDefinitions, siteTitle, socialImage } from "./deployment";

export type HeadTag = "link" | "meta";

export function buildHeadEntry(tag: HeadTag, attributes: Record<string, string>): HeadConfig {
  return [tag, attributes];
}

function resolveLocaleSeo(relativePath: string) {
  return relativePath.startsWith("ru/")
    ? localeDefinitions.ru
    : localeDefinitions.root;
}

export function transformSitemapItems(items: Array<Record<string, any>>) {
  return items
    .filter((item) => {
      const pathname = new URL(item.url, docsOrigin).pathname;
      return pathname !== "/" && pathname !== "/ru/";
    })
    .map((item) => {
      const pathname = new URL(item.url, docsOrigin).pathname;
      const sourceRelativePath = routeToRelativePath(pathname);
      const lastmod = sourceRelativePath ? getMarkdownLastModified(sourceRelativePath) : null;
      const alternates = sourceRelativePath ? buildAlternateRoutes(sourceRelativePath) : null;
      const links = [...(item.links ?? [])];

      if (alternates?.en && !links.some((link) => link.hreflang === localeDefinitions.root.hreflang)) {
        links.push({
          lang: localeDefinitions.root.lang,
          hreflang: localeDefinitions.root.hreflang,
          url: buildDocsUrl(alternates.en)
        });
      }

      if (alternates?.ru && !links.some((link) => link.hreflang === localeDefinitions.ru.hreflang)) {
        links.push({
          lang: localeDefinitions.ru.lang,
          hreflang: localeDefinitions.ru.hreflang,
          url: buildDocsUrl(alternates.ru)
        });
      }

      if (alternates?.xDefault && !links.some((link) => link.hreflang === "x-default")) {
        links.push({
          lang: "x-default",
          hreflang: "x-default",
          url: buildDocsUrl(alternates.xDefault)
        });
      }

      return {
        ...item,
        lastmod: lastmod ?? item.lastmod,
        links
      };
    });
}

export function buildPageHead({ pageData, title, description }: {
  pageData: { relativePath: string; isNotFound?: boolean };
  title: string;
  description: string;
}) {
  if (pageData.isNotFound) {
    return [
      buildHeadEntry("meta", {
        name: "robots",
        content: "noindex, nofollow"
      })
    ];
  }

  const pageMeta = getPageMeta(pageData.relativePath);
  const route = relativePathToRoute(pageData.relativePath);
  const canonicalUrl = buildDocsUrl(route);
  const alternates = buildAlternateRoutes(pageData.relativePath);
  const locale = resolveLocaleSeo(pageData.relativePath);
  const resolvedTitle = pageMeta?.title || title;
  const resolvedDescription = pageMeta?.description || description;
  const alternateLocale =
    locale.key === "ru"
      ? alternates.en
        ? localeDefinitions.root.ogLocale
        : null
      : alternates.ru
        ? localeDefinitions.ru.ogLocale
        : null;
  const headEntries: HeadConfig[] = [
    buildHeadEntry("link", { rel: "canonical", href: canonicalUrl })
  ];

  if (alternates.en) {
    headEntries.push(
      buildHeadEntry("link", {
        rel: "alternate",
        hreflang: localeDefinitions.root.hreflang,
        href: buildDocsUrl(alternates.en)
      })
    );
  }

  if (alternates.ru) {
    headEntries.push(
      buildHeadEntry("link", {
        rel: "alternate",
        hreflang: localeDefinitions.ru.hreflang,
        href: buildDocsUrl(alternates.ru)
      })
    );
  }

  if (alternates.xDefault) {
    headEntries.push(
      buildHeadEntry("link", {
        rel: "alternate",
        hreflang: "x-default",
        href: buildDocsUrl(alternates.xDefault)
      })
    );
  }

  return [
    ...headEntries,
    buildHeadEntry("meta", { property: "og:type", content: "website" }),
    buildHeadEntry("meta", { property: "og:site_name", content: siteTitle }),
    buildHeadEntry("meta", { property: "og:title", content: resolvedTitle }),
    buildHeadEntry("meta", { property: "og:description", content: resolvedDescription }),
    buildHeadEntry("meta", { property: "og:url", content: canonicalUrl }),
    buildHeadEntry("meta", { property: "og:locale", content: locale.ogLocale }),
    buildHeadEntry("meta", { property: "og:image", content: socialImage }),
    buildHeadEntry("meta", { property: "og:image:width", content: "1200" }),
    buildHeadEntry("meta", { property: "og:image:height", content: "630" }),
    buildHeadEntry("meta", { property: "og:image:type", content: "image/png" }),
    buildHeadEntry("meta", { property: "og:image:alt", content: `${siteTitle} preview` }),
    buildHeadEntry("meta", { name: "twitter:card", content: "summary_large_image" }),
    buildHeadEntry("meta", { name: "twitter:title", content: resolvedTitle }),
    buildHeadEntry("meta", { name: "twitter:description", content: resolvedDescription }),
    buildHeadEntry("meta", { name: "twitter:image", content: socialImage })
  ].concat(
    alternateLocale
      ? [buildHeadEntry("meta", { property: "og:locale:alternate", content: alternateLocale })]
      : []
  );
}
