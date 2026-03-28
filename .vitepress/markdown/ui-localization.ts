import type MarkdownIt from "markdown-it";
import {
  resolveLocale
} from "../content-data";

export function buildPermalinkAriaLabel(relativePath: string, title: string) {
  const normalizedTitle = title.trim();

  return resolveLocale(relativePath) === "ru"
    ? `Ссылка на раздел «${normalizedTitle}»`
    : `Permalink to "${normalizedTitle}"`;
}

export function configureMarkdownUiLocalization(md: MarkdownIt) {
  const defaultFenceRenderer = md.renderer.rules.fence?.bind(md.renderer.rules);
  const defaultLinkOpenRenderer = md.renderer.rules.link_open?.bind(md.renderer.rules);

  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const html = defaultFenceRenderer
      ? defaultFenceRenderer(tokens, index, options, env, self)
      : self.renderToken(tokens, index, options);
    const relativePath = typeof env.relativePath === "string" ? env.relativePath : "";
    const copyCodeTitle = resolveLocale(relativePath) === "ru" ? "Копировать код" : "Copy Code";

    return html.replace(/title="Copy Code"/g, `title="${copyCodeTitle}"`);
  };

  md.renderer.rules.link_open = (tokens, index, options, env, self) => {
    const token = tokens[index];
    const className = token.attrGet("class") || "";
    const relativePath = typeof env.relativePath === "string" ? env.relativePath : "";

    if (className.split(/\s+/u).includes("header-anchor")) {
      const title = tokens
        .filter((childToken) => childToken.type === "text" || childToken.type === "code_inline")
        .map((childToken) => childToken.content)
        .join("")
        .trim();

      token.attrSet("aria-label", buildPermalinkAriaLabel(relativePath, title));
    }

    return defaultLinkOpenRenderer
      ? defaultLinkOpenRenderer(tokens, index, options, env, self)
      : self.renderToken(tokens, index, options);
  };
}
