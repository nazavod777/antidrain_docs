export type { Locale } from "./content/markdown-files";
export {
  getMarkdownLastModified,
  hasMarkdownPage,
  isGlossaryPage,
  resolveLocale
} from "./content/markdown-files";
export type { GlossaryEntry } from "./content/glossary";
export {
  buildGlossaryHref,
  findGlossaryEntryByHref,
  getGlossaryEntries,
  getGlossaryMatchers
} from "./content/glossary";
export type { PageMeta } from "./content/page-meta";
export {
  getAllPageMeta,
  getPageMeta
} from "./content/page-meta";
export {
  buildAlternateRoutes,
  relativePathToRoute,
  routeToRelativePath
} from "./content/routes";
export {
  buildMainSiteNav,
  englishSearchTranslations,
  englishSidebar,
  russianSearchTranslations,
  russianSidebar
} from "./content/navigation";
