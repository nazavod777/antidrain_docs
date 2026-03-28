import type { DefaultTheme } from "vitepress";
import {
  DOCS_SECTION_ORDER,
  getDocsPagesForLocale,
  getDocsSectionLabel
} from "../../shared/docs-site-manifest.mjs";

type Locale = "en" | "ru";

function buildSidebar(locale: Locale): DefaultTheme.SidebarItem[] {
  const pages = getDocsPagesForLocale(locale);

  return DOCS_SECTION_ORDER.map((section) => ({
    text: getDocsSectionLabel(section, locale),
    items: pages
      .filter((page) => page.section === section)
      .map((page) => ({
        text: page.text,
        link: page.route
      }))
  }));
}

export const englishSidebar = buildSidebar("en");
export const russianSidebar = buildSidebar("ru");

export function buildMainSiteNav(mainSiteOrigin: string): {
  englishNav: DefaultTheme.NavItem[];
  russianNav: DefaultTheme.NavItem[];
} {
  const englishNav = getDocsPagesForLocale("en")
    .filter((page) => page.topNav)
    .map((page) => ({
      text: page.text,
      link: page.route
    }));

  const russianNav = getDocsPagesForLocale("ru")
    .filter((page) => page.topNav)
    .map((page) => ({
      text: page.text,
      link: page.route
    }));

  return {
    englishNav: [...englishNav, { text: "Main Site", link: `${mainSiteOrigin}/` }],
    russianNav: [...russianNav, { text: "Основной сайт", link: `${mainSiteOrigin}/` }]
  };
}

export const englishSearchTranslations = {
  button: {
    buttonText: "Search",
    buttonAriaLabel: "Search documentation"
  },
  modal: {
    displayDetails: "Display detailed list",
    resetButtonTitle: "Reset search",
    backButtonTitle: "Close search",
    noResultsText: "No results for this query",
    footer: {
      selectText: "Select",
      selectKeyAriaLabel: "enter",
      navigateText: "Navigate",
      navigateUpKeyAriaLabel: "up arrow",
      navigateDownKeyAriaLabel: "down arrow",
      closeText: "Close",
      closeKeyAriaLabel: "escape"
    }
  }
} satisfies NonNullable<DefaultTheme.LocalSearchOptions["translations"]>;

export const russianSearchTranslations = {
  button: {
    buttonText: "Поиск",
    buttonAriaLabel: "Поиск по документации"
  },
  modal: {
    displayDetails: "Показать подробный список",
    resetButtonTitle: "Сбросить поиск",
    backButtonTitle: "Закрыть поиск",
    noResultsText: "По этому запросу ничего не найдено",
    footer: {
      selectText: "Выбрать",
      selectKeyAriaLabel: "enter",
      navigateText: "Навигация",
      navigateUpKeyAriaLabel: "стрелка вверх",
      navigateDownKeyAriaLabel: "стрелка вниз",
      closeText: "Закрыть",
      closeKeyAriaLabel: "escape"
    }
  }
} satisfies NonNullable<DefaultTheme.LocalSearchOptions["translations"]>;
