import type MarkdownIt from "markdown-it";
import type { Locale } from "../content-data";
import {
  findGlossaryEntryByHref,
  getGlossaryMatchers
} from "../content-data";

type TokenLike = {
  type: string;
  tag: string;
  content: string;
  children?: TokenLike[] | null;
};

type TokenConstructor = new (type: string, tag: string, nesting: number) => {
  attrJoin(name: string, value: string): void;
  attrSet(name: string, value: string): void;
  content: string;
};

const WORD_CHAR_RE = /[\p{L}\p{N}_-]/u;
function isWordCharacter(character?: string) {
  return Boolean(character && WORD_CHAR_RE.test(character));
}

function hasWordBoundary(text: string, start: number, end: number) {
  const before = text[start - 1];
  const after = text[end];
  const first = text[start];
  const last = text[end - 1];

  if (isWordCharacter(first) && isWordCharacter(before)) {
    return false;
  }

  if (isWordCharacter(last) && isWordCharacter(after)) {
    return false;
  }

  return true;
}

function createTextToken(TokenCtor: TokenConstructor, content: string) {
  const token = new TokenCtor("text", "", 0);
  token.content = content;
  return token;
}

function createGlossaryLinkTokens(
  TokenCtor: TokenConstructor,
  content: string,
  href: string,
  summary: string
) {
  const linkOpen = new TokenCtor("link_open", "a", 1);
  linkOpen.attrSet("href", href);
  linkOpen.attrJoin("class", "glossary-link");
  if (summary) {
    linkOpen.attrSet("data-glossary-tooltip", summary);
    linkOpen.attrSet("data-glossary-term", content.trim());
  }

  const linkText = createTextToken(TokenCtor, content);
  const linkClose = new TokenCtor("link_close", "a", -1);

  return [linkOpen, linkText, linkClose];
}

function tokenClassIncludes(token: {
  attrGet(name: string): string | null;
}, className: string) {
  const currentValue = token.attrGet("class") || "";
  return currentValue.split(/\s+/u).includes(className);
}

function annotateExistingGlossaryLink(
  token: {
    attrGet(name: string): string | null;
    attrJoin(name: string, value: string): void;
    attrSet(name: string, value: string): void;
  },
  locale: Locale
) {
  const href = token.attrGet("href") || "";
  const glossaryEntry = findGlossaryEntryByHref(locale, href);

  if (!glossaryEntry || tokenClassIncludes(token, "header-anchor")) {
    return;
  }

  if (!tokenClassIncludes(token, "glossary-link")) {
    token.attrJoin("class", "glossary-link");
  }

  if (glossaryEntry.summary) {
    token.attrSet("data-glossary-tooltip", glossaryEntry.summary);
    token.attrSet("data-glossary-term", glossaryEntry.title);
  }
}

function findNextGlossaryMatch(
  text: string,
  lowerText: string,
  matchers: GlossaryMatcher[],
  cursor: number
) {
  let bestMatch:
    | {
        href: string;
        index: number;
        length: number;
        summary: string;
      }
    | undefined;

  for (const matcher of matchers) {
    let index = lowerText.indexOf(matcher.needleLower, cursor);

    while (index !== -1) {
      const end = index + matcher.needleLower.length;

      if (hasWordBoundary(text, index, end)) {
        if (
          !bestMatch ||
          index < bestMatch.index ||
          (index === bestMatch.index && matcher.needleLower.length > bestMatch.length)
        ) {
          bestMatch = {
            href: matcher.href,
            index,
            length: matcher.needleLower.length,
            summary: matcher.summary
          };
        }
        break;
      }

      index = lowerText.indexOf(matcher.needleLower, index + 1);
    }
  }

  return bestMatch;
}

function replaceTextTokenWithGlossaryLinks(
  TokenCtor: TokenConstructor,
  token: TokenLike,
  matchers: GlossaryMatcher[]
) {
  const content = token.content;
  const lowerContent = content.toLowerCase();
  const replacementTokens = [];

  let cursor = 0;

  while (cursor < content.length) {
    const nextMatch = findNextGlossaryMatch(content, lowerContent, matchers, cursor);

    if (!nextMatch) {
      replacementTokens.push(createTextToken(TokenCtor, content.slice(cursor)));
      break;
    }

    if (nextMatch.index > cursor) {
      replacementTokens.push(createTextToken(TokenCtor, content.slice(cursor, nextMatch.index)));
    }

    const matchedText = content.slice(nextMatch.index, nextMatch.index + nextMatch.length);
    replacementTokens.push(
      ...createGlossaryLinkTokens(TokenCtor, matchedText, nextMatch.href, nextMatch.summary)
    );
    cursor = nextMatch.index + nextMatch.length;
  }

  return replacementTokens.length > 0 ? replacementTokens : [token];
}

export function configureGlossaryAutolinks(
  md: MarkdownIt,
  resolveLocale: (relativePath: string) => Locale,
  isGlossaryPage: (relativePath: string) => boolean
) {
  md.core.ruler.after("inline", "antidrain-glossary-autolinks", (state) => {
    const relativePath =
      typeof state.env.relativePath === "string" ? state.env.relativePath : "";

    if (!relativePath || isGlossaryPage(relativePath)) {
      return;
    }

    const locale = resolveLocale(relativePath);
    const matchers = getGlossaryMatchers(locale);

    for (let tokenIndex = 0; tokenIndex < state.tokens.length; tokenIndex += 1) {
      const token = state.tokens[tokenIndex];

      if (token.type !== "inline" || !token.children?.length) {
        continue;
      }

      if (state.tokens[tokenIndex - 1]?.type === "heading_open") {
        continue;
      }

      const nextChildren: TokenLike[] = [];
      let linkDepth = 0;

      for (const childToken of token.children as TokenLike[]) {
        if (childToken.type === "link_open") {
          annotateExistingGlossaryLink(
            childToken as TokenLike & {
              attrGet(name: string): string | null;
              attrJoin(name: string, value: string): void;
              attrSet(name: string, value: string): void;
            },
            locale
          );
          linkDepth += 1;
          nextChildren.push(childToken);
          continue;
        }

        if (childToken.type === "link_close") {
          linkDepth = Math.max(0, linkDepth - 1);
          nextChildren.push(childToken);
          continue;
        }

        if (
          linkDepth > 0 ||
          childToken.type !== "text" ||
          !childToken.content ||
          childToken.tag === "code"
        ) {
          nextChildren.push(childToken);
          continue;
        }

        nextChildren.push(
          ...replaceTextTokenWithGlossaryLinks(state.Token as TokenConstructor, childToken, matchers)
        );
      }

      token.children = nextChildren as typeof token.children;
    }
  });
}
