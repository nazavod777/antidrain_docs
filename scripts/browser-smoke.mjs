import { fileURLToPath } from "node:url";
import { getRepresentativeDocsRoutes } from "../shared/docs-site-manifest.mjs";
import { startDocsStaticServer } from "./shared/docs-static-server.mjs";

const distDir = fileURLToPath(new URL("../.vitepress/dist/", import.meta.url));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));

  assert(
    metrics.scrollWidth <= metrics.clientWidth + 1,
    `${label} has horizontal overflow: ${JSON.stringify(metrics)}`
  );
}

const { chromium } = await import("playwright");
const server = await startDocsStaticServer({ rootDir: distDir });
const representativeRoutes = getRepresentativeDocsRoutes();

try {
  const rootResponse = await fetch(`${server.baseUrl}/`, {
    redirect: "manual"
  });

  assert(rootResponse.status === 308, "Root route did not redirect.");
  assert(rootResponse.headers.get("location") === "/getting-started", "Root route redirected incorrectly.");

  const ruRootResponse = await fetch(`${server.baseUrl}/ru/`, {
    redirect: "manual"
  });

  assert(ruRootResponse.status === 308, "RU root route did not redirect.");
  assert(
    ruRootResponse.headers.get("location") === "/ru/getting-started",
    "RU root route redirected incorrectly."
  );

  const extensionRouteResponse = await fetch(`${server.baseUrl}/overview.html`, {
    redirect: "manual"
  });

  assert(extensionRouteResponse.status === 308, "Extension route /overview.html did not redirect.");
  assert(
    extensionRouteResponse.headers.get("location") === "/overview",
    "Extension route /overview.html redirected to the wrong clean URL."
  );

  const markdownRouteResponse = await fetch(`${server.baseUrl}/overview.md`, {
    redirect: "manual"
  });

  assert(markdownRouteResponse.status === 308, "Extension route /overview.md did not redirect.");
  assert(
    markdownRouteResponse.headers.get("location") === "/overview",
    "Extension route /overview.md redirected to the wrong clean URL."
  );

  const notFoundResponse = await fetch(`${server.baseUrl}/missing-page`, {
    redirect: "manual"
  });

  const notFoundHtml = await notFoundResponse.text();

  assert(notFoundResponse.status === 404, "Unknown docs route did not return 404.");
  assert(
    /name="robots"\s+content="noindex,\s*nofollow"/i.test(notFoundHtml),
    "Built 404 page is missing the noindex robots meta."
  );

  const browser = await chromium.launch({ headless: true });

  try {
    const browserContext = await browser.newContext();
    const consoleMessages = [];
    const pageErrors = [];
    const overviewPage = await browserContext.newPage();
    await overviewPage.setViewportSize({ width: 1365, height: 900 });

    overviewPage.on("console", (message) => {
      consoleMessages.push(message.text());
    });
    overviewPage.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await overviewPage.goto(`${server.baseUrl}/overview`, { waitUntil: "networkidle" });
    await overviewPage.locator(".VPDocAsideOutline--custom .outline-link").first().waitFor({
      state: "attached"
    });
    await overviewPage.waitForFunction(
      () =>
        document.querySelectorAll(".VPLocalNav").length === 0 &&
        document.querySelectorAll(".VPNavScreen").length === 0
    );
    await assertNoHorizontalOverflow(overviewPage, "/overview desktop");

    const overviewShellState = await overviewPage.evaluate(() => ({
      localNavCount: document.querySelectorAll(".VPLocalNav").length,
      navScreenCount: document.querySelectorAll(".VPNavScreen").length,
      docTitle: (document.querySelector(".vp-doc h1")?.textContent || "")
        .replace(/\u200B/gu, "")
        .trim(),
      docParagraphs: document.querySelectorAll(".vp-doc p").length
    }));

    assert(
      overviewShellState.localNavCount === 0,
      `Overview still mounts a hidden local-nav shell on desktop: ${JSON.stringify(overviewShellState)}`
    );
    assert(
      overviewShellState.navScreenCount === 0,
      `Overview still mounts a hidden screen-nav shell on desktop: ${JSON.stringify(overviewShellState)}`
    );
    assert(
      overviewShellState.docTitle === "Overview",
      `Overview content did not survive hydration: ${JSON.stringify(overviewShellState)}`
    );
    assert(
      overviewShellState.docParagraphs > 3,
      `Overview prose did not render after hydration: ${JSON.stringify(overviewShellState)}`
    );

    assert(
      !consoleMessages.some((message) => /Hydration completed but contains mismatches/i.test(message)),
      `Hydration mismatch detected on /overview: ${consoleMessages.join("\n")}`
    );
    assert(pageErrors.length === 0, `Runtime page errors on /overview: ${pageErrors.join("\n")}`);

    for (const routePath of representativeRoutes) {
      const routePage = await browserContext.newPage();
      await routePage.setViewportSize({ width: 1365, height: 900 });
      const routeErrors = [];

      routePage.on("pageerror", (error) => {
        routeErrors.push(error.message);
      });

      await routePage.goto(`${server.baseUrl}${routePath}`, { waitUntil: "networkidle" });
      await routePage.waitForFunction(() => document.querySelectorAll(".VPLocalNav").length === 0);
      await assertNoHorizontalOverflow(routePage, `${routePath} desktop`);

      const routeState = await routePage.evaluate(() => ({
        title: (document.querySelector(".vp-doc h1")?.textContent || "")
          .replace(/\u200B/gu, "")
          .trim(),
        paragraphCount: document.querySelectorAll(".vp-doc p").length,
        notFoundVisible: Boolean(document.querySelector(".docs-not-found")),
        localNavCount: document.querySelectorAll(".VPLocalNav").length
      }));

      assert(!routeState.notFoundVisible, `${routePath} unexpectedly rendered docs 404 state.`);
      assert(routeState.title.length > 0, `${routePath} rendered without an H1 title.`);
      assert(routeState.paragraphCount > 1, `${routePath} rendered suspiciously little prose.`);
      assert(routeState.localNavCount === 0, `${routePath} still mounts local-nav on desktop.`);
      assert(routeErrors.length === 0, `Runtime page errors on ${routePath}: ${routeErrors.join("\n")}`);
      await routePage.close();
    }

    const tabletPage = await browserContext.newPage();
    await tabletPage.setViewportSize({ width: 820, height: 900 });
    await tabletPage.goto(`${server.baseUrl}/getting-started`, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(tabletPage, "/getting-started tablet");
    await tabletPage.click(".VPNavBarHamburger");
    await tabletPage.waitForSelector(".VPNavScreen .VPNavScreenMenuLink");

    const tabletMenuState = await tabletPage.evaluate(() => ({
      screenVisible: (() => {
        const navScreen = document.querySelector(".VPNavScreen");
        return navScreen instanceof HTMLElement
          ? getComputedStyle(navScreen).display !== "none"
          : false;
      })(),
      localNavHidden: (() => {
        const localNav = document.querySelector(".VPLocalNav");
        return localNav instanceof HTMLElement
          ? getComputedStyle(localNav).visibility === "hidden"
          : false;
      })(),
      localNavCount: document.querySelectorAll(".VPLocalNav").length,
      menuScrollable: (() => {
        const navScreen = document.querySelector(".VPNavScreen");
        return navScreen instanceof HTMLElement
          ? navScreen.scrollHeight >= navScreen.clientHeight
          : false;
      })()
    }));

    assert(tabletMenuState.screenVisible, "Tablet nav screen did not open.");
    assert(tabletMenuState.localNavHidden, "Tablet nav did not hide local nav while screen menu is open.");
    assert(tabletMenuState.menuScrollable, "Tablet nav screen does not expose a scrollable viewport.");
    assert(
      tabletMenuState.localNavCount === 1,
      `Tablet nav duplicated local-nav shell: ${JSON.stringify(tabletMenuState)}`
    );

    await tabletPage.click(".VPNavBarHamburger");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const touchPage = await mobileContext.newPage();

    await touchPage.goto(`${server.baseUrl}/getting-started`, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(touchPage, "/getting-started mobile");

    const mobileNavWidths = await touchPage.evaluate(() => {
      const menuButton = document.querySelector(".VPLocalNav .menu");
      const outlineButton = document.querySelector(".VPLocalNavOutlineDropdown button");

      if (!(menuButton instanceof HTMLElement) || !(outlineButton instanceof HTMLElement)) {
        return null;
      }

      return {
        menuWidth: Math.round(menuButton.getBoundingClientRect().width),
        outlineWidth: Math.round(outlineButton.getBoundingClientRect().width)
      };
    });

    assert(mobileNavWidths, "Mobile local-nav buttons were not rendered.");
    assert(
      Math.abs(mobileNavWidths.menuWidth - mobileNavWidths.outlineWidth) <= 1,
      `Mobile local-nav buttons drifted in width: ${JSON.stringify(mobileNavWidths)}`
    );

    const compactAnchorGeometry = await touchPage.evaluate(() => {
      const heading = document.querySelector(".vp-doc h2");
      const anchor = heading?.querySelector(".header-anchor");
      const card = document.querySelector(".VPDoc .content-container");

      if (
        !(heading instanceof HTMLElement) ||
        !(anchor instanceof HTMLElement) ||
        !(card instanceof HTMLElement)
      ) {
        return null;
      }

      return {
        cardLeft: Math.round(card.getBoundingClientRect().left),
        headingLeft: Math.round(heading.getBoundingClientRect().left),
        anchorLeft: Math.round(anchor.getBoundingClientRect().left)
      };
    });

    assert(compactAnchorGeometry, "Compact heading geometry could not be inspected.");
    assert(
      compactAnchorGeometry.anchorLeft >= compactAnchorGeometry.cardLeft - 10,
      `Compact heading anchor overhang is too large: ${JSON.stringify(compactAnchorGeometry)}`
    );
    assert(
      compactAnchorGeometry.anchorLeft < compactAnchorGeometry.headingLeft,
      `Compact heading anchor no longer sits in the left gutter: ${JSON.stringify(compactAnchorGeometry)}`
    );

    await touchPage.locator(".vp-doc a.glossary-link").first().click();
    await touchPage.waitForURL(/\/glossary#/);

    const invalidHashPage = await browserContext.newPage();
    const invalidHashErrors = [];

    invalidHashPage.on("pageerror", (error) => {
      invalidHashErrors.push(error.message);
    });

    await invalidHashPage.goto(`${server.baseUrl}/overview#%E0%A4%A`, { waitUntil: "networkidle" });
    await invalidHashPage.waitForSelector(".VPDocAsideOutline--custom");
    assert(
      invalidHashErrors.length === 0,
      `Malformed hash still throws in docs runtime: ${invalidHashErrors.join("\n")}`
    );

    const noJsContext = await browser.newContext({ javaScriptEnabled: false });
    const noJsPage = await noJsContext.newPage();

    await noJsPage.goto(`${server.baseUrl}/overview`, { waitUntil: "domcontentloaded" });
    const noJsOutline = await noJsPage.locator(".VPDocAsideOutline--custom .outline-title").textContent();

    assert(
      noJsOutline?.trim() === "On this page",
      "No-JS desktop outline did not render from SSR markup."
    );

    const ruPage = await browserContext.newPage();
    await ruPage.goto(`${server.baseUrl}/ru/affiliate-program`, { waitUntil: "networkidle" });
    await ruPage.waitForSelector(".copy");

    const ruUiLabels = await ruPage.evaluate(() => ({
      mainNav: document.querySelector("#main-nav-aria-label")?.textContent?.trim() || "",
      sidebar: document.querySelector("#sidebar-aria-label")?.textContent?.trim() || "",
      mobile: document
        .querySelector(".VPNavBarHamburger")
        ?.getAttribute("aria-label") || "",
      pager: document.querySelector("#doc-footer-aria-label")?.textContent?.trim() || "",
      permalink: document
        .querySelector("h1 .header-anchor")
        ?.getAttribute("aria-label") || "",
      copy: document.querySelector(".copy")?.getAttribute("title") || ""
    }));

    assert(ruUiLabels.mainNav === "Основная навигация", "RU main navigation label is not localized.");
    assert(ruUiLabels.sidebar === "Боковая навигация", "RU sidebar navigation label is not localized.");
    assert(
      ruUiLabels.mobile === "Мобильная навигация",
      "RU mobile navigation label is not localized."
    );
    assert(
      ruUiLabels.pager === "Переход между страницами",
      "RU pager label is not localized."
    );
    assert(
      ruUiLabels.permalink.startsWith("Ссылка на раздел"),
      "RU permalink aria-label is not localized."
    );
    assert(ruUiLabels.copy === "Копировать код", "RU copy-code tooltip is not localized.");

    const notFoundPage = await browserContext.newPage();
    await notFoundPage.goto(`${server.baseUrl}/missing-page`, { waitUntil: "networkidle" });
    await notFoundPage.waitForSelector(".docs-not-found__actions");

    const notFoundCopy = await notFoundPage.evaluate(() => ({
      badge: document.querySelector(".docs-not-found__badge")?.textContent?.trim() || "",
      actions: [...document.querySelectorAll(".docs-not-found__actions a")].map((item) =>
        item.textContent?.trim() || ""
      )
    }));

    assert(notFoundCopy.badge === "404 · Page not found", "EN docs 404 badge is incorrect.");
    assert(
      notFoundCopy.actions.includes("Getting Started") &&
        notFoundCopy.actions.includes("Overview") &&
        notFoundCopy.actions.includes("Glossary"),
      `EN docs 404 actions are incomplete: ${JSON.stringify(notFoundCopy)}`
    );

    const notFoundRuPage = await browserContext.newPage();
    await notFoundRuPage.goto(`${server.baseUrl}/ru/missing-page`, { waitUntil: "networkidle" });
    await notFoundRuPage.waitForSelector(".docs-not-found__actions");

    const notFoundRuCopy = await notFoundRuPage.evaluate(() => ({
      badge: document.querySelector(".docs-not-found__badge")?.textContent?.trim() || "",
      actions: [...document.querySelectorAll(".docs-not-found__actions a")].map((item) =>
        item.textContent?.trim() || ""
      )
    }));

    assert(notFoundRuCopy.badge === "404 · Страница не найдена", "RU docs 404 badge is incorrect.");
    assert(
      notFoundRuCopy.actions.includes("С чего начать") &&
        notFoundRuCopy.actions.includes("Обзор") &&
        notFoundRuCopy.actions.includes("Словарь"),
      `RU docs 404 actions are incomplete: ${JSON.stringify(notFoundRuCopy)}`
    );

    await noJsContext.close();
    await mobileContext.close();
    await browserContext.close();
  } finally {
    await browser.close();
  }
} finally {
  await server.close();
}

console.log("docs-site browser smoke checks passed");
