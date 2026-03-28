import type MarkdownIt from "markdown-it";
import { isGlossaryPage, resolveLocale } from "./content-data";
import { configureGlossaryAutolinks } from "./markdown/glossary-autolink";
import {
  buildPermalinkAriaLabel,
  configureMarkdownUiLocalization
} from "./markdown/ui-localization";

export { buildPermalinkAriaLabel };

export function configureDocsMarkdown(md: MarkdownIt) {
  configureMarkdownUiLocalization(md);
  configureGlossaryAutolinks(md, resolveLocale, isGlossaryPage);
}
