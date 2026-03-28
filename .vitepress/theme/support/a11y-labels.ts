export type DocsA11yLabelKey =
  | "mainNavigation"
  | "sidebarNavigation"
  | "extraNavigation"
  | "mobileNavigation"
  | "pager";

const DEFAULT_A11Y_LABELS: Record<DocsA11yLabelKey, string> = {
  mainNavigation: "Main Navigation",
  sidebarNavigation: "Sidebar Navigation",
  extraNavigation: "Extra navigation",
  mobileNavigation: "Mobile navigation",
  pager: "Pager"
};

export function resolveDocsA11yLabel(themeValue: unknown, key: DocsA11yLabelKey) {
  if (
    themeValue &&
    typeof themeValue === "object" &&
    "antidrainA11yLabels" in themeValue &&
    themeValue.antidrainA11yLabels &&
    typeof themeValue.antidrainA11yLabels === "object" &&
    key in themeValue.antidrainA11yLabels
  ) {
    const nextLabel = themeValue.antidrainA11yLabels[key as keyof typeof themeValue.antidrainA11yLabels];

    if (typeof nextLabel === "string" && nextLabel.trim()) {
      return nextLabel;
    }
  }

  return DEFAULT_A11Y_LABELS[key];
}
