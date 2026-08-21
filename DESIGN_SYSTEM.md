# Docs design system

The docs share one design system with the product site (`antidrain_site2`).
This file records what is copied, what deliberately differs, and why.

## Source of truth

`antidrain_site2/src/styles/tokens.css` owns the palette and the scales.
`docs/.vitepress/theme/tokens.css` vendors it **verbatim** — the copied region
is byte-identical, and `npm run tokens:check` diffs it against site2 (local
only; site2 is not on the CI runner).

The rule from site2's own design doc still applies here: **never write a colour
literal outside the token files.** Take the base for a solid colour, `-dim` for
a tinted background, `-border` for a hairline, and compose any other alpha from
the triplet — `rgba(var(--color-danger-rgb), 0.14)`.

`vp-bridge.css` contains no colour literals at all; it only maps VitePress's
variables onto ours. `prose.css` contains none either.

## How the layers stack

Imported in this order from `theme/index.ts`:

| File | Role |
| --- | --- |
| `tokens.css` | site2's dark palette, verbatim, plus docs-only additions at the bottom |
| `light.css` | light theme, `:root:not(.dark)` |
| `vp-bridge.css` | maps `--vp-*` onto `--color-*` — this is the whole restyle |
| `base.css` | root font-size, focus-visible, selection, scrollbars, reduced motion |
| `prose.css` | long-form typography, callouts, tables, cards, nav and sidebar detail |

Nothing in these files uses `!important`. The GitBook stylesheet it replaced
used it 405 times in 1799 lines, because it was fighting a theme instead of
configuring one.

## Deliberate deviations from site2

### 1. Root font-size is 19px on desktop, not 21px

site2 sets `html { font-size: 21px }` at ≥1024px. It has a single content
column. Docs has three (sidebar, prose, outline), and 21px pushes the prose
measure past a comfortable line length while squeezing both rails. Docs keeps
site2's fluid mobile root verbatim and steps to **19px**.

Validate by screenshotting a site2 page and a docs page side by side at 1440px
and comparing text density — not by reasoning about the number.

### 2. A light theme exists

site2 is dark-only and documents that as a known gap. Docs has a theme toggle,
so a light palette had to be derived. Method: take each base colour into CIE
Lab, move L\* until it clears 4.5:1 on `--color-bg-card-hover` (the worst light
surface), hold a\* and b\* so the hue survives.

Two asymmetries that are easy to get wrong:

- **`-text-hover` moves darker (−7 L\*), not lighter.** On a dark surface a
  lighter step gains contrast; on a light one it loses it.
- **The `-rgb` triplets are overridden too.** Components compose tints from the
  triplet, so pointing it at the light-mode value keeps every existing
  `rgba(var(--color-x-rgb), a)` correct without touching a component rule.

If site2 ever gains a light theme, these values should move there and be
vendored back, the same way the dark palette is.

### 3. Two tokens that site2 needs but does not define

- `--shadow-lg` — site2 references it in `.pending-nav-dialog` but never
  defines it, so that modal renders with no shadow. Defined here from
  `.net-sel__dropdown`, which is the same elevation. **Bug to report upstream.**
- `--color-accent-text` — `#00d4aa` measures 1.9:1 on white and cannot carry
  text. In dark mode it equals the accent; in light mode it is a darker step.
  Use it for text and links, and `--color-accent` for fills, borders and active
  states.

Plus `--color-on-accent` (ink on an accent fill) and `--color-code-surface`
(site2's `.tx-log` terminal shade, promoted to a token because docs is full of
code blocks).

### 4. Accent-filled controls carry an accent-text border

In light mode the accent fill only reaches 3:1 against white, and the hover
fill is lighter still. A `--color-accent-text` border means the control
boundary clears 3:1 at rest *and* on hover regardless of the fill. Harmless in
dark mode.

### 5. The brand mark is inverted in light mode

`antidrain-mark.png` is a pure-white alpha silhouette — site2 only ever shows
it on a near-black page, so it was never a problem there. On a white docs
background it disappeared completely. Because the artwork is monochrome, a
plain `filter: invert(1)` produces an exact black mark with the alpha channel
intact, so there is no filter chain to tune and no second asset to keep in
sync. If the mark ever becomes multi-colour, this needs a real light-mode
asset instead.

Not ported: site2 recolours the mark to accent on hover via `mask-image`. That
needs an overlay element VitePress's logo markup does not give us, and it is
decoration rather than a correctness issue.

### 6. VitePress's z-index scale is not mapped

site2's `--z-*` tokens describe a different component set, and VitePress's
ordering is load-bearing: `--vp-z-index-sidebar` is 60 on mobile so the drawer
covers the nav, but drops to 25 at ≥960px — below the nav's 30 — so the nav
title paints above the desktop sidebar. A flat mapping onto `--z-modal` hid the
logo and wordmark. Left to VitePress.

### 7. `--vp-layout-max-width` is not overridden

At ≥1440px `VPSidebar` computes its width as
`(100% - (layout-max-width - 64px)) / 2 + sidebar-width - 32px`. Raising the
value above the viewport makes the first term negative and silently shrinks the
sidebar — 1680px cost 120px of sidebar at exactly 1440px wide. VitePress's
1440px default keeps that term at zero or above.

## Callouts

Callouts use site2's status-surface formula: 1px hairline in `-border`, fill in
`-dim`, mono uppercase title in `-text`. Three details are worth not
re-discovering:

- **Vertical padding is tighter than horizontal**, via
  `--plaque-padding-y` / `--plaque-padding-x`. A uniform `--spacing-sm` left
  the text floating: 21px above the title and 29px below the last line, because
  the block's padding stacked with the paragraph's own 8px bottom margin. First
  and last children now have their block margins zeroed so the padding is the
  only vertical space, which is what makes the block symmetric (15px/15px at
  desktop, 13px/13px at mobile). The landing page's "wallet at risk" bar is the
  same kind of plaque and shares the tokens — anything else tinted-and-bordered
  should too, rather than re-deriving the numbers.
- **Scoped to `:is(.vp-doc, .docs-landing)`** — the root landing is a
  `layout: page` route with no `.vp-doc` wrapper, so scoping to `.vp-doc` alone
  left its callout on VitePress's defaults and a different padding from every
  other callout on the site.
- **The title needs `p` in the selector.** VitePress zeroes
  `.vp-doc .custom-block p:first-child`, which outranks a class-only rule, so
  the title is styled as `.custom-block p.custom-block-title`.

Every callout must carry an explicit title. `::: danger` with no title renders
the literal English word "DANGER", which is wrong on a Russian page —
`check:parity` fails the build on it.

## Search is scoped per locale

VitePress builds **one local-search index per locale** and `VPLocalSearchBox`
only ever loads the current one. Two consequences:

- A Russian query never returns the English twin of a page, which is what we
  want.
- The root locale contains exactly one page — the language picker at `/` — so a
  search launched there can match nothing but itself and reports "No results"
  for any real query. It reads as broken search rather than as an empty scope.

`themeConfig.search` **cannot** be scoped per locale: VitePress enables local
search through a build-time global derived from the site-level key, so moving
it into the locale blocks disables search everywhere. The picker therefore
suppresses the search UI itself:

- the button is hidden by `.Layout:has(.docs-landing) .VPNavBarSearch` in
  `prose.css`;
- Ctrl/Cmd+K and `/` are swallowed by a capture-phase listener in
  `docs/index.md`, because VitePress binds those at the document level whether
  or not the button is visible.

Search is present and working on all 26 real docs pages. If the picker ever
grows into a searchable page, the fix is to make `/` part of a real locale
rather than to re-enable a control over a one-page index.

## Accessibility rules carried over from site2

- Use `:focus-visible`, never bare `:focus`.
- Never build a focus ring from a low-alpha colour. `check-contrast.mjs` fails
  the build on `rgba(...)`, `-dim` or `-border` inside `--focus-ring`.
- Never remove an outline without an equally prominent replacement.
- 44×44 minimum touch targets under `@media (pointer: coarse)`.
- Every animation neutralised under `prefers-reduced-motion`, and the resting
  visual restated so nothing disappears.

## Checks

`npm run check:contrast` verifies every text/surface pair in both themes and
the focus-ring rule. It reads the values out of the CSS rather than duplicating
them, so editing a token and forgetting to re-check is a build failure. It is
the analogue of site2's `checkDesignTokens.mjs` and
`checkInteractionAffordances.mjs`.
