import { fileURLToPath } from "node:url";
import { startDocsStaticServer } from "./shared/docs-static-server.mjs";

const distDir = fileURLToPath(new URL("../.vitepress/dist/", import.meta.url));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const { chromium } = await import("playwright");
const server = await startDocsStaticServer({ rootDir: distDir });

try {
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

  const browser = await chromium.launch({ headless: true });

  try {
    const browserContext = await browser.newContext();
    const consoleMessages = [];
    const pageErrors = [];
    const overviewPage = await browserContext.newPage();

    overviewPage.on("console", (message) => {
      consoleMessages.push(message.text());
    });
    overviewPage.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    await overviewPage.goto(`${server.baseUrl}/overview`, { waitUntil: "networkidle" });
    await overviewPage.waitForSelector(".VPDocAsideOutline--custom .outline-link");

    assert(
      !consoleMessages.some((message) => /Hydration completed but contains mismatches/i.test(message)),
      `Hydration mismatch detected on /overview: ${consoleMessages.join("\n")}`
    );
    assert(pageErrors.length === 0, `Runtime page errors on /overview: ${pageErrors.join("\n")}`);

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
      extra: document
        .querySelector(".VPNavBarExtra .button")
        ?.getAttribute("aria-label") || "",
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
      ruUiLabels.extra === "Дополнительная навигация",
      "RU extra navigation label is not localized."
    );
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

    await noJsContext.close();
    await browserContext.close();
  } finally {
    await browser.close();
  }
} finally {
  await server.close();
}

console.log("docs-site browser smoke checks passed");
