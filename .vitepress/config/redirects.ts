import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { buildDocsUrl } from "./deployment";
import {
  DOCS_REDIRECT_MANIFEST,
  getDocsPageByRoute,
  getDocsSectionLabel
} from "../../shared/docs-site-manifest.mjs";
import { getCleanDocsPath, getRedirectTargetPathname } from "../../shared/docs-site-policy.mjs";

const DIST_ROOT = fileURLToPath(new URL("../dist", import.meta.url));

function buildRedirectFallbackHtml(pathname: keyof typeof DOCS_REDIRECT_MANIFEST) {
  const page = DOCS_REDIRECT_MANIFEST[pathname];
  const canonicalUrl = buildDocsUrl(page.targetRoute);
  const locale = pathname === "/ru" ? "ru" : "en";
  const targetPage = getDocsPageByRoute(page.targetRoute);
  const overviewLabel = getDocsSectionLabel("start-here", locale);
  const helperLabel =
    locale === "ru"
      ? "Резервные точки входа"
      : "Fallback routes";

  return `<!DOCTYPE html>
<html lang="${page.lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${page.title}</title>
    <meta name="description" content="${page.description}">
    <meta name="robots" content="noindex, nofollow">
    <meta http-equiv="refresh" content="0;url=${page.targetRoute}">
    <link rel="canonical" href="${canonicalUrl}">
    <style>
      :root {
        color-scheme: dark;
        --docs-bg: #0b1220;
        --docs-bg-strong: #09101c;
        --docs-panel: linear-gradient(180deg, rgba(10, 18, 32, 0.96) 0%, rgba(8, 14, 25, 0.99) 100%);
        --docs-panel-border: rgba(57, 89, 133, 0.52);
        --docs-control-border: rgba(40, 66, 102, 0.86);
        --docs-control-bg: rgba(16, 27, 44, 0.96);
        --docs-text: #f4f8ff;
        --docs-text-muted: #b2c1d8;
        --docs-brand: #9ed1ff;
      }
      * { box-sizing: border-box; }
      html, body { min-height: 100%; }
      body {
        margin: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at top, rgba(62, 148, 255, 0.18), transparent 30%),
          radial-gradient(circle at 82% 12%, rgba(18, 84, 193, 0.12), transparent 24%),
          linear-gradient(180deg, #0f1728 0%, var(--docs-bg) 100%);
        color: var(--docs-text);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        position: relative;
        width: min(100%, 620px);
        padding: 32px;
        border: 1px solid var(--docs-panel-border);
        border-radius: 30px;
        background: var(--docs-panel);
        box-shadow:
          0 26px 64px rgba(0, 0, 0, 0.24),
          inset 0 1px 0 rgba(147, 191, 255, 0.08);
        overflow: hidden;
      }
      main::before {
        content: "";
        position: absolute;
        inset: 0 auto auto 0;
        width: min(52%, 240px);
        height: 180px;
        pointer-events: none;
        background: radial-gradient(circle at top left, rgba(123, 195, 255, 0.18), transparent 74%);
      }
      .badge,
      h1,
      p,
      .actions,
      .helper {
        position: relative;
        z-index: 1;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        min-height: 38px;
        padding: 0 14px;
        border: 1px solid rgba(90, 173, 255, 0.34);
        border-radius: 999px;
        background: rgba(90, 173, 255, 0.12);
        color: var(--docs-brand);
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h1 {
        margin: 18px 0 0;
        max-width: 12ch;
        font-size: clamp(2.1rem, 5vw, 3.15rem);
        line-height: 0.98;
        letter-spacing: -0.05em;
        text-wrap: balance;
      }
      p {
        margin: 18px 0 0;
        line-height: 1.72;
        color: var(--docs-text-muted);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 24px;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 18px;
        border: 1px solid var(--docs-control-border);
        border-radius: 15px;
        background: var(--docs-control-bg);
        color: var(--docs-text);
        font-weight: 700;
        text-decoration: none;
      }
      .button--primary {
        border-color: transparent;
        background: linear-gradient(135deg, #7bc3ff 0%, #3597ff 100%);
        color: #03111f;
        box-shadow: 0 18px 38px rgba(18, 82, 173, 0.28);
      }
      .helper {
        margin-top: 28px;
        padding-top: 20px;
        border-top: 1px solid rgba(37, 59, 90, 0.76);
      }
      .helper-label {
        margin: 0;
        color: var(--docs-brand);
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .helper ul {
        margin: 14px 0 0;
        padding-left: 18px;
        color: var(--docs-text-muted);
        line-height: 1.7;
      }
      @media (max-width: 639px) {
        main {
          padding: 24px 18px;
          border-radius: 24px;
        }
        .actions {
          flex-direction: column;
        }
        .button {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <p class="badge">${page.badge}</p>
      <h1>${page.heading}</h1>
      <p>${page.body}</p>
      <div class="actions">
        <a class="button button--primary" href="${page.targetRoute}">${page.primaryLabel}</a>
        <a class="button" href="${page.secondaryRoute}">${page.secondaryLabel}</a>
      </div>
      <section class="helper" aria-label="${helperLabel}">
        <p class="helper-label">${helperLabel}</p>
        <ul>
          <li>${targetPage ? getDocsSectionLabel(targetPage.section, locale) : overviewLabel}</li>
          <li>${page.primaryLabel}</li>
          <li>${page.secondaryLabel}</li>
        </ul>
      </section>
    </main>
  </body>
</html>
`;
}

export function writeRedirectFallbackPages() {
  for (const pathname of Object.keys(DOCS_REDIRECT_MANIFEST) as Array<
    keyof typeof DOCS_REDIRECT_MANIFEST
  >) {
    const relativeOutputPath = pathname === "/" ? "index.html" : `${pathname.replace(/^\/+/u, "")}/index.html`;
    const outputPath = path.join(DIST_ROOT, relativeOutputPath);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buildRedirectFallbackHtml(pathname), "utf8");
  }
}

export function createDocsCleanUrlPlugin(): Plugin {
  const installRedirectMiddleware = (middlewares: {
    use: (
      handler: (
        req: { url?: string },
        res: {
          statusCode?: number;
          setHeader: (name: string, value: string) => void;
          end: () => void;
        },
        next: () => void
      ) => void
    ) => void;
  }) => {
    middlewares.use((request, response, next) => {
      const requestUrl = request.url ?? "/";
      const parsedUrl = new URL(requestUrl, "http://127.0.0.1");
      const isViteImportRequest =
        parsedUrl.searchParams.has("import") ||
        parsedUrl.searchParams.has("raw") ||
        parsedUrl.searchParams.has("url");

      if (isViteImportRequest) {
        next();
        return;
      }

      const redirectTarget = getRedirectTargetPathname(parsedUrl.pathname);

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
