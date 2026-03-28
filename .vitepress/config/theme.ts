import type { DefaultTheme } from "vitepress";
import { mainSiteOrigin } from "./deployment";
import {
  buildMainSiteNav,
  englishSearchTranslations,
  englishSidebar,
  russianSearchTranslations,
  russianSidebar
} from "../content-data";

type ThemeLabels = {
  outlineLabel: string;
  prevLabel: string;
  nextLabel: string;
  navigationLabel: string;
  backToTopLabel: string;
  languageLabel: string;
  skipToContentLabel: string;
  updatedLabel: string;
  a11yLabels: {
    mainNavigation: string;
    sidebarNavigation: string;
    extraNavigation: string;
    mobileNavigation: string;
    pager: string;
  };
};

const { englishNav, russianNav } = buildMainSiteNav(mainSiteOrigin);

export const search = {
  provider: "local",
  options: {
    detailedView: "auto",
    translations: englishSearchTranslations,
    locales: {
      root: {
        translations: englishSearchTranslations
      },
      ru: {
        translations: russianSearchTranslations
      }
    }
  }
} satisfies DefaultTheme.Config["search"];

function createThemeConfig(
  nav: DefaultTheme.NavItem[],
  sidebar: DefaultTheme.SidebarItem[],
  labels: ThemeLabels
): DefaultTheme.Config & { antidrainA11yLabels: ThemeLabels["a11yLabels"] } {
  return {
    nav,
    sidebar,
    search,
    outline: {
      level: [2, 3],
      label: labels.outlineLabel
    },
    docFooter: {
      prev: labels.prevLabel,
      next: labels.nextLabel
    },
    sidebarMenuLabel: labels.navigationLabel,
    returnToTopLabel: labels.backToTopLabel,
    langMenuLabel: labels.languageLabel,
    skipToContentLabel: labels.skipToContentLabel,
    lastUpdated: {
      text: labels.updatedLabel
    },
    antidrainA11yLabels: labels.a11yLabels
  };
}

export const englishThemeConfig = createThemeConfig(englishNav, englishSidebar, {
  outlineLabel: "On this page",
  prevLabel: "Previous page",
  nextLabel: "Next page",
  navigationLabel: "Navigation",
  backToTopLabel: "Back to top",
  languageLabel: "Languages",
  skipToContentLabel: "Skip to content",
  updatedLabel: "Updated at",
  a11yLabels: {
    mainNavigation: "Main Navigation",
    sidebarNavigation: "Sidebar Navigation",
    extraNavigation: "Extra navigation",
    mobileNavigation: "Mobile navigation",
    pager: "Pager"
  }
});

export const russianThemeConfig = createThemeConfig(russianNav, russianSidebar, {
  outlineLabel: "На этой странице",
  prevLabel: "Предыдущая страница",
  nextLabel: "Следующая страница",
  navigationLabel: "Навигация",
  backToTopLabel: "Наверх",
  languageLabel: "Язык",
  skipToContentLabel: "Перейти к содержимому",
  updatedLabel: "Обновлено",
  a11yLabels: {
    mainNavigation: "Основная навигация",
    sidebarNavigation: "Боковая навигация",
    extraNavigation: "Дополнительная навигация",
    mobileNavigation: "Мобильная навигация",
    pager: "Переход между страницами"
  }
});
