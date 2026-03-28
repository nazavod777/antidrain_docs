export const DOCS_SECTION_ORDER = Object.freeze([
  "start-here",
  "workflow",
  "reference"
]);

export const DOCS_SECTION_LABELS = Object.freeze({
  en: Object.freeze({
    "start-here": "Start Here",
    workflow: "Workflow",
    reference: "Reference"
  }),
  ru: Object.freeze({
    "start-here": "Первые шаги",
    workflow: "Рабочий процесс",
    reference: "Справка"
  })
});

export const DOCS_PAGE_MANIFEST = Object.freeze([
  {
    id: "overview",
    section: "start-here",
    topNav: true,
    representative: true,
    locales: {
      en: Object.freeze({
        text: "Overview",
        route: "/overview",
        relativePath: "overview.md"
      }),
      ru: Object.freeze({
        text: "Обзор",
        route: "/ru/overview",
        relativePath: "ru/overview.md"
      })
    }
  },
  {
    id: "getting-started",
    section: "start-here",
    topNav: true,
    representative: true,
    locales: {
      en: Object.freeze({
        text: "Getting Started",
        route: "/getting-started",
        relativePath: "getting-started.md"
      }),
      ru: Object.freeze({
        text: "С чего начать",
        route: "/ru/getting-started",
        relativePath: "ru/getting-started.md"
      })
    }
  },
  {
    id: "crypto-basics",
    section: "start-here",
    topNav: false,
    representative: false,
    locales: {
      en: Object.freeze({
        text: "Crypto Basics",
        route: "/crypto-basics",
        relativePath: "crypto-basics.md"
      }),
      ru: Object.freeze({
        text: "Основы крипты",
        route: "/ru/crypto-basics",
        relativePath: "ru/crypto-basics.md"
      })
    }
  },
  {
    id: "glossary",
    section: "start-here",
    topNav: true,
    representative: true,
    locales: {
      en: Object.freeze({
        text: "Glossary",
        route: "/glossary",
        relativePath: "glossary.md"
      }),
      ru: Object.freeze({
        text: "Словарь",
        route: "/ru/glossary",
        relativePath: "ru/glossary.md"
      })
    }
  },
  {
    id: "safety-basics",
    section: "start-here",
    topNav: false,
    representative: false,
    locales: {
      en: Object.freeze({
        text: "Safety Basics",
        route: "/safety-basics",
        relativePath: "safety-basics.md"
      }),
      ru: Object.freeze({
        text: "Базовая безопасность",
        route: "/ru/safety-basics",
        relativePath: "ru/safety-basics.md"
      })
    }
  },
  {
    id: "donor-wallet",
    section: "workflow",
    topNav: false,
    representative: true,
    locales: {
      en: Object.freeze({
        text: "Donor Wallet",
        route: "/donor-wallet",
        relativePath: "donor-wallet.md"
      }),
      ru: Object.freeze({
        text: "Донорский кошелек",
        route: "/ru/donor-wallet",
        relativePath: "ru/donor-wallet.md"
      })
    }
  },
  {
    id: "actions-and-routes",
    section: "workflow",
    topNav: false,
    representative: false,
    locales: {
      en: Object.freeze({
        text: "Actions and Routes",
        route: "/actions-and-routes",
        relativePath: "actions-and-routes.md"
      }),
      ru: Object.freeze({
        text: "Действия и маршруты",
        route: "/ru/actions-and-routes",
        relativePath: "ru/actions-and-routes.md"
      })
    }
  },
  {
    id: "tx-builder",
    section: "workflow",
    topNav: false,
    representative: false,
    locales: {
      en: Object.freeze({
        text: "TX Builder",
        route: "/tx-builder",
        relativePath: "tx-builder.md"
      }),
      ru: Object.freeze({
        text: "TX Builder",
        route: "/ru/tx-builder",
        relativePath: "ru/tx-builder.md"
      })
    }
  },
  {
    id: "fund-donor-and-tx-sender",
    section: "workflow",
    topNav: false,
    representative: false,
    locales: {
      en: Object.freeze({
        text: "Fund Donor and TX Sender",
        route: "/fund-donor-and-tx-sender",
        relativePath: "fund-donor-and-tx-sender.md"
      }),
      ru: Object.freeze({
        text: "Fund Donor и TX Sender",
        route: "/ru/fund-donor-and-tx-sender",
        relativePath: "ru/fund-donor-and-tx-sender.md"
      })
    }
  },
  {
    id: "donor-assets",
    section: "workflow",
    topNav: false,
    representative: false,
    locales: {
      en: Object.freeze({
        text: "Donor Assets",
        route: "/donor-assets",
        relativePath: "donor-assets.md"
      }),
      ru: Object.freeze({
        text: "Активы донора",
        route: "/ru/donor-assets",
        relativePath: "ru/donor-assets.md"
      })
    }
  },
  {
    id: "fees-and-execution-behavior",
    section: "reference",
    topNav: false,
    representative: false,
    locales: {
      en: Object.freeze({
        text: "Fees and Execution Behavior",
        route: "/fees-and-execution-behavior",
        relativePath: "fees-and-execution-behavior.md"
      }),
      ru: Object.freeze({
        text: "Комиссии и логика исполнения",
        route: "/ru/fees-and-execution-behavior",
        relativePath: "ru/fees-and-execution-behavior.md"
      })
    }
  },
  {
    id: "affiliate-program",
    section: "reference",
    topNav: false,
    representative: true,
    locales: {
      en: Object.freeze({
        text: "Affiliate Program",
        route: "/affiliate-program",
        relativePath: "affiliate-program.md"
      }),
      ru: Object.freeze({
        text: "Партнерская программа",
        route: "/ru/affiliate-program",
        relativePath: "ru/affiliate-program.md"
      })
    }
  },
  {
    id: "faq-and-troubleshooting",
    section: "reference",
    topNav: true,
    representative: true,
    locales: {
      en: Object.freeze({
        text: "FAQ",
        route: "/faq-and-troubleshooting",
        relativePath: "faq-and-troubleshooting.md"
      }),
      ru: Object.freeze({
        text: "FAQ",
        route: "/ru/faq-and-troubleshooting",
        relativePath: "ru/faq-and-troubleshooting.md"
      })
    }
  }
]);

export const DOCS_REDIRECT_MANIFEST = Object.freeze({
  "/": Object.freeze({
    lang: "en-US",
    title: "Redirecting",
    description: "Redirecting to Getting Started.",
    targetRoute: "/getting-started",
    badge: "Route moved",
    heading: "Getting Started lives here now.",
    body:
      "This shortcut now opens the main onboarding route. Use the button below or the fallback links to continue safely.",
    primaryLabel: "Open Getting Started",
    secondaryLabel: "Open Overview",
    secondaryRoute: "/overview"
  }),
  "/ru": Object.freeze({
    lang: "ru-RU",
    title: "Переадресация",
    description: "Переадресация на страницу С чего начать.",
    targetRoute: "/ru/getting-started",
    badge: "Маршрут обновлён",
    heading: "Стартовая точка теперь здесь.",
    body:
      "Этот короткий путь теперь открывает основную стартовую страницу. Используйте кнопку ниже или резервные ссылки, чтобы продолжить без ошибок.",
    primaryLabel: "Открыть С чего начать",
    secondaryLabel: "Открыть Обзор",
    secondaryRoute: "/ru/overview"
  })
});

function normalizeRelativePath(relativePath) {
  return relativePath.replace(/\\/g, "/").replace(/^\/+/u, "");
}

function normalizeRoute(route) {
  const normalizedRoute = route.replace(/[?#].*$/u, "").replace(/\/+$/u, "");
  return normalizedRoute || "/";
}

export function getDocsPagesForLocale(locale) {
  return DOCS_PAGE_MANIFEST.map((page) => ({
    id: page.id,
    section: page.section,
    topNav: page.topNav,
    representative: page.representative,
    ...page.locales[locale]
  }));
}

export function getDocsPageByRelativePath(relativePath) {
  const normalized = normalizeRelativePath(relativePath);

  return (
    DOCS_PAGE_MANIFEST.find((page) =>
      Object.values(page.locales).some((entry) => entry.relativePath === normalized)
    ) ?? null
  );
}

export function getDocsPageByRoute(route) {
  const normalized = normalizeRoute(route);

  return (
    DOCS_PAGE_MANIFEST.find((page) =>
      Object.values(page.locales).some((entry) => entry.route === normalized)
    ) ?? null
  );
}

export function getDocsLocalizedPage(page, locale) {
  return page.locales[locale];
}

export function getDocsSectionLabel(section, locale) {
  return DOCS_SECTION_LABELS[locale][section];
}

export function getDocsManifestRelativePaths() {
  return DOCS_PAGE_MANIFEST.flatMap((page) =>
    Object.values(page.locales).map((entry) => entry.relativePath)
  );
}

export function getRepresentativeDocsRoutes() {
  return DOCS_PAGE_MANIFEST.filter((page) => page.representative).flatMap((page) => [
    page.locales.en.route,
    page.locales.ru.route
  ]);
}
