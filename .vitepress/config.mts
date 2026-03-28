import { defineConfig, type DefaultTheme, type HeadConfig } from "vitepress";
import type { Plugin } from "vite";
import {
  buildAlternateRoutes,
  getRedirectTargetRoute,
  isRedirectStubRelativePath,
  relativePathToRoute
} from "./content-data";
import { configureDocsMarkdown } from "./markdown";
import { getRedirectTargetPathname } from "./support/root-redirect";
import { slugifyHeading } from "./slug";
import { getCleanDocsPath } from "./support/clean-url";

const siteUrl = "https://docs.antidrain.me";
const socialImage = `${siteUrl}/antidrain-preview.png`;

const englishSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: "Start Here",
    items: [
      { text: "Overview", link: "/overview" },
      { text: "Getting Started", link: "/getting-started" },
      { text: "Crypto Basics", link: "/crypto-basics" },
      { text: "Glossary", link: "/glossary" },
      { text: "Safety Basics", link: "/safety-basics" }
    ]
  },
  {
    text: "Workflow",
    items: [
      { text: "Donor Wallet", link: "/donor-wallet" },
      { text: "Actions and Routes", link: "/actions-and-routes" },
      { text: "TX Builder", link: "/tx-builder" },
      { text: "Fund Donor and TX Sender", link: "/fund-donor-and-tx-sender" },
      { text: "Donor Assets", link: "/donor-assets" }
    ]
  },
  {
    text: "Reference",
    items: [
      { text: "Fees and Execution Behavior", link: "/fees-and-execution-behavior" },
      { text: "Affiliate Program", link: "/affiliate-program" },
      { text: "FAQ and Troubleshooting", link: "/faq-and-troubleshooting" }
    ]
  }
];

const russianSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: "Первые шаги",
    items: [
      { text: "Обзор", link: "/ru/overview" },
      { text: "С чего начать", link: "/ru/getting-started" },
      { text: "Основы крипты", link: "/ru/crypto-basics" },
      { text: "Словарь", link: "/ru/glossary" },
      { text: "Базовая безопасность", link: "/ru/safety-basics" }
    ]
  },
  {
    text: "Рабочий процесс",
    items: [
      { text: "Донорский кошелек", link: "/ru/donor-wallet" },
      { text: "Действия и маршруты", link: "/ru/actions-and-routes" },
      { text: "TX Builder", link: "/ru/tx-builder" },
      { text: "Fund Donor и TX Sender", link: "/ru/fund-donor-and-tx-sender" },
      { text: "Активы донора", link: "/ru/donor-assets" }
    ]
  },
  {
    text: "Справка",
    items: [
      { text: "Комиссии и логика исполнения", link: "/ru/fees-and-execution-behavior" },
      { text: "Партнерская программа", link: "/ru/affiliate-program" },
      { text: "FAQ и устранение проблем", link: "/ru/faq-and-troubleshooting" }
    ]
  }
];

const englishNav: DefaultTheme.NavItem[] = [
  { text: "Overview", link: "/overview" },
  { text: "Getting Started", link: "/getting-started" },
  { text: "Glossary", link: "/glossary" },
  { text: "FAQ", link: "/faq-and-troubleshooting" },
  { text: "Main Site", link: "https://antidrain.me/" }
];

const russianNav: DefaultTheme.NavItem[] = [
  { text: "Обзор", link: "/ru/overview" },
  { text: "С чего начать", link: "/ru/getting-started" },
  { text: "Словарь", link: "/ru/glossary" },
  { text: "FAQ", link: "/ru/faq-and-troubleshooting" },
  { text: "Основной сайт", link: "https://antidrain.me/" }
];

const englishSearch = {
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

const russianSearch = {
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

const search = {
  provider: "local",
  options: {
    detailedView: "auto",
    translations: englishSearch,
    locales: {
      root: {
        translations: englishSearch
      },
      ru: {
        translations: russianSearch
      }
    }
  }
} satisfies DefaultTheme.Config["search"];

type ThemeLabels = {
  outlineLabel: string;
  prevLabel: string;
  nextLabel: string;
  appearanceLabel: string;
  navigationLabel: string;
  backToTopLabel: string;
  languageLabel: string;
  skipToContentLabel: string;
  updatedLabel: string;
  lightModeSwitchTitle: string;
  darkModeSwitchTitle: string;
  a11yLabels: {
    mainNavigation: string;
    sidebarNavigation: string;
    extraNavigation: string;
    mobileNavigation: string;
    pager: string;
  };
};

function createThemeConfig(
  nav: DefaultTheme.NavItem[],
  sidebar: DefaultTheme.SidebarItem[],
  labels: ThemeLabels
): DefaultTheme.Config & {
  antidrainA11yLabels: ThemeLabels["a11yLabels"];
  lightModeSwitchTitle: string;
  darkModeSwitchTitle: string;
} {
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
    darkModeSwitchLabel: labels.appearanceLabel,
    sidebarMenuLabel: labels.navigationLabel,
    returnToTopLabel: labels.backToTopLabel,
    langMenuLabel: labels.languageLabel,
    skipToContentLabel: labels.skipToContentLabel,
    lightModeSwitchTitle: labels.lightModeSwitchTitle,
    darkModeSwitchTitle: labels.darkModeSwitchTitle,
    lastUpdated: {
      text: labels.updatedLabel
    },
    antidrainA11yLabels: labels.a11yLabels
  };
}

const englishThemeConfig = createThemeConfig(englishNav, englishSidebar, {
  outlineLabel: "On this page",
  prevLabel: "Previous page",
  nextLabel: "Next page",
  appearanceLabel: "Appearance",
  navigationLabel: "Navigation",
  backToTopLabel: "Back to top",
  languageLabel: "Languages",
  skipToContentLabel: "Skip to content",
  updatedLabel: "Updated at",
  lightModeSwitchTitle: "Switch to light theme",
  darkModeSwitchTitle: "Switch to dark theme",
  a11yLabels: {
    mainNavigation: "Main Navigation",
    sidebarNavigation: "Sidebar Navigation",
    extraNavigation: "Extra navigation",
    mobileNavigation: "Mobile navigation",
    pager: "Pager"
  }
});

const russianThemeConfig = createThemeConfig(russianNav, russianSidebar, {
  outlineLabel: "На этой странице",
  prevLabel: "Предыдущая страница",
  nextLabel: "Следующая страница",
  appearanceLabel: "Тема",
  navigationLabel: "Навигация",
  backToTopLabel: "Наверх",
  languageLabel: "Язык",
  skipToContentLabel: "Перейти к содержимому",
  updatedLabel: "Обновлено",
  lightModeSwitchTitle: "Переключить на светлую тему",
  darkModeSwitchTitle: "Переключить на тёмную тему",
  a11yLabels: {
    mainNavigation: "Основная навигация",
    sidebarNavigation: "Боковая навигация",
    extraNavigation: "Дополнительная навигация",
    mobileNavigation: "Мобильная навигация",
    pager: "Переход между страницами"
  }
});

function buildHeadEntry(
  tag: string,
  attributes: Record<string, string>
): HeadConfig {
  return [tag, attributes];
}

function createDocsCleanUrlPlugin(): Plugin {
  const installRedirectMiddleware = (middlewares: { use: (handler: (req: { url?: string }, res: {
    statusCode?: number;
    setHeader: (name: string, value: string) => void;
    end: () => void;
  }, next: () => void) => void) => void }) => {
    middlewares.use((request, response, next) => {
      const requestUrl = request.url ?? "/";
      const parsedUrl = new URL(requestUrl, "http://127.0.0.1");
      const redirectTarget = getRedirectTargetPathname(parsedUrl.pathname);
      const isViteImportRequest =
        parsedUrl.searchParams.has("import") ||
        parsedUrl.searchParams.has("raw") ||
        parsedUrl.searchParams.has("url");

      if (isViteImportRequest) {
        next();
        return;
      }

      if (redirectTarget) {
        response.statusCode = 308;
        response.setHeader("Location", `${redirectTarget}${parsedUrl.search}`);
        response.end();
        return;
      }

      const cleanPath = getCleanDocsPath(parsedUrl.pathname);

      if (!cleanPath || cleanPath === parsedUrl.pathname) {
        next();
        return;
      }

      response.statusCode = 308;
      response.setHeader("Location", `${cleanPath}${parsedUrl.search}`);
      response.end();
    });
  };

  return {
    name: "antidrain-docs-clean-url-enforcer",
    configureServer(server) {
      installRedirectMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      installRedirectMiddleware(server.middlewares);
    }
  };
}

export default defineConfig({
  title: "AntiDrain Docs",
  description:
    "Beginner-friendly AntiDrain documentation for donor wallet setup, route selection, TX Builder, funding, execution, and cleanup.",
  cleanUrls: true,
  appearance: false,
  useWebFonts: false,
  lastUpdated: true,
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
    hostname: siteUrl,
    transformItems(items) {
      return items.filter((item) => {
        const pathname = new URL(item.url, siteUrl).pathname;
        return pathname !== "/" && pathname !== "/ru/";
      });
    }
  },
  head: [
    ["meta", { name: "theme-color", content: "#0b1220" }],
    ["meta", { name: "color-scheme", content: "dark" }],
    ["link", { rel: "icon", href: "/favicon.ico", sizes: "any" }]
  ],
  themeConfig: englishThemeConfig,
  locales: {
    root: {
      label: "English",
      lang: "en-US",
      themeConfig: englishThemeConfig
    },
    ru: {
      label: "Русский",
      lang: "ru-RU",
      link: "/ru/",
      title: "Документация AntiDrain",
      description:
        "Пошаговая документация AntiDrain для donor wallet, выбора маршрута, TX Builder, funding, исполнения и cleanup.",
      themeConfig: russianThemeConfig
    }
  },
  transformHead({ pageData, title, description }) {
    if (pageData.isNotFound) {
      return;
    }

    if (isRedirectStubRelativePath(pageData.relativePath)) {
      const targetRoute = getRedirectTargetRoute(pageData.relativePath);
      const canonicalTargetUrl = targetRoute ? `${siteUrl}${targetRoute}` : siteUrl;

      return [
        buildHeadEntry("meta", {
          "http-equiv": "refresh",
          content: `0;url=${targetRoute ?? "/"}`
        }),
        buildHeadEntry("meta", {
          name: "robots",
          content: "noindex, nofollow"
        }),
        buildHeadEntry("link", {
          rel: "canonical",
          href: canonicalTargetUrl
        })
      ];
    }

    const route = relativePathToRoute(pageData.relativePath);
    const canonicalUrl = `${siteUrl}${route}`;
    const alternates = buildAlternateRoutes(pageData.relativePath);
    const locale = pageData.relativePath.startsWith("ru/") ? "ru_RU" : "en_US";
    const headEntries: HeadConfig[] = [
      buildHeadEntry("link", { rel: "canonical", href: canonicalUrl })
    ];

    if (alternates.en) {
      headEntries.push(
        buildHeadEntry("link", {
          rel: "alternate",
          hreflang: "en",
          href: `${siteUrl}${alternates.en}`
        })
      );
    }

    if (alternates.ru) {
      headEntries.push(
        buildHeadEntry("link", {
          rel: "alternate",
          hreflang: "ru",
          href: `${siteUrl}${alternates.ru}`
        })
      );
    }

    if (alternates.xDefault) {
      headEntries.push(
        buildHeadEntry("link", {
          rel: "alternate",
          hreflang: "x-default",
          href: `${siteUrl}${alternates.xDefault}`
        })
      );
    }

    return [
      ...headEntries,
      buildHeadEntry("meta", { property: "og:type", content: "website" }),
      buildHeadEntry("meta", { property: "og:site_name", content: "AntiDrain Docs" }),
      buildHeadEntry("meta", { property: "og:title", content: title }),
      buildHeadEntry("meta", { property: "og:description", content: description }),
      buildHeadEntry("meta", { property: "og:url", content: canonicalUrl }),
      buildHeadEntry("meta", { property: "og:locale", content: locale }),
      buildHeadEntry("meta", { property: "og:image", content: socialImage }),
      buildHeadEntry("meta", { property: "og:image:alt", content: "AntiDrain Docs preview" }),
      buildHeadEntry("meta", { name: "twitter:card", content: "summary_large_image" }),
      buildHeadEntry("meta", { name: "twitter:title", content: title }),
      buildHeadEntry("meta", { name: "twitter:description", content: description }),
      buildHeadEntry("meta", { name: "twitter:image", content: socialImage })
    ];
  }
});
