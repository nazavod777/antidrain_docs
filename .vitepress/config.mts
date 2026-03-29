import { defineConfig } from "vitepress";
import { configureDocsMarkdown } from "./markdown";
import { slugifyHeading } from "./slug";
import { docsOrigin, localeDefinitions, siteTitle } from "./config/deployment";
import { buildPageHead, transformSitemapItems } from "./config/head";
import { rewriteMacPlatformProbe, runDocsBuildPostprocess, stripVpIconsPreload } from "./config/html";
import { createDocsCleanUrlPlugin, writeRedirectFallbackPages } from "./config/redirects";
import { englishThemeConfig, russianThemeConfig } from "./config/theme";

export default defineConfig({
  title: siteTitle,
  description:
    "Beginner-friendly AntiDrain documentation for donor wallet setup, route selection, TX Builder, funding, execution, and cleanup.",
  cleanUrls: true,
  appearance: false,
  useWebFonts: false,
  lastUpdated: true,
  buildEnd() {
    runDocsBuildPostprocess();
    writeRedirectFallbackPages();
  },
  vite: {
    plugins: [createDocsCleanUrlPlugin()]
  },
  markdown: {
    anchor: {
      slugify: slugifyHeading
    },
    headers: {
      slugify: slugifyHeading
    },
    toc: {
      slugify: slugifyHeading
    },
    config(md) {
      configureDocsMarkdown(md);
    }
  },
  sitemap: {
    hostname: docsOrigin,
    transformItems: transformSitemapItems
  },
  head: [
    ["meta", { name: "theme-color", content: "#0b1220" }],
    ["meta", { name: "color-scheme", content: "dark" }],
    ["link", { rel: "icon", href: "/favicon.ico", sizes: "any" }],
    ["link", { rel: "shortcut icon", href: "/favicon.ico" }],
    ["link", { rel: "apple-touch-icon", href: "/antidrain-mark.png" }]
  ],
  themeConfig: englishThemeConfig,
  locales: {
    root: {
      label: localeDefinitions.root.label,
      lang: localeDefinitions.root.lang,
      themeConfig: englishThemeConfig
    },
    ru: {
      label: localeDefinitions.ru.label,
      lang: localeDefinitions.ru.lang,
      link: "/ru/",
      title: "Документация AntiDrain",
      description:
        "Пошаговая документация AntiDrain для donor wallet, выбора маршрута, TX Builder, funding, исполнения и cleanup.",
      themeConfig: russianThemeConfig
    }
  },
  transformHtml(code, _id, ctx) {
    return rewriteMacPlatformProbe(stripVpIconsPreload(code));
  },
  transformHead({ pageData, title, description }) {
    return buildPageHead({ pageData, title, description });
  }
});
