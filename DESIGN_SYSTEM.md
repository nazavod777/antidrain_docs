# Docs design system

The docs share one design system with the product site (`antidrain_site`).
This file records what is copied, what deliberately differs, and why.

## Source of truth

`antidrain_site/src/styles/tokens.css` owns the palette and the scales.
`docs/.vitepress/theme/tokens.css` vendors it **verbatim** — the copied region
is byte-identical, and `npm run tokens:check` diffs it against the site (local
only; the site is not on the CI runner).

The rule from the site's own design doc still applies here: **never write a colour
literal outside the token files.** Take the base for a solid colour, `-dim` for
a tinted background, `-border` for a hairline, and compose any other alpha from
the triplet — `rgba(var(--color-danger-rgb), 0.14)`.

`vp-bridge.css` contains no colour literals at all; it only maps VitePress's
variables onto ours. `prose.css` contains none either.

## How the layers stack

Imported in this order from `theme/index.ts`:

| File | Role |
| --- | --- |
| `tokens.css` | the site's dark palette, verbatim, plus docs-only additions at the bottom |
| `light.css` | light theme, `:root:not(.dark)` |
| `vp-bridge.css` | maps `--vp-*` onto `--color-*` — this is the whole restyle |
| `base.css` | root font-size, focus-visible, selection, scrollbars, reduced motion |
| `prose.css` | long-form typography, callouts, tables, cards, nav and sidebar detail |

Nothing in these files uses `!important`. The GitBook stylesheet it replaced
used it 405 times in 1799 lines, because it was fighting a theme instead of
configuring one.

## Deliberate deviations from the site

### 1. Root font-size is 19px on desktop, not 21px

The site sets `html { font-size: 21px }` at ≥1024px. It has a single content
column. Docs has three (sidebar, prose, outline), and 21px pushes the prose
measure past a comfortable line length while squeezing both rails. Docs keeps
the site's fluid mobile root verbatim and steps to **19px**.

Validate by screenshotting a site page and a docs page side by side at 1440px
and comparing text density — not by reasoning about the number.

### 2. A light theme exists

The site is dark-only and documents that as a known gap. Docs has a theme toggle,
so a light palette had to be derived. Method: take each base colour into CIE
Lab, move L\* until it clears 4.5:1 on `--color-bg-card-hover` (the worst light
surface), hold a\* and b\* so the hue survives.

Two asymmetries that are easy to get wrong:

- **`-text-hover` moves darker (−7 L\*), not lighter.** On a dark surface a
  lighter step gains contrast; on a light one it loses it.
- **The `-rgb` triplets are overridden too.** Components compose tints from the
  triplet, so pointing it at the light-mode value keeps every existing
  `rgba(var(--color-x-rgb), a)` correct without touching a component rule.

If the site ever gains a light theme, these values should move there and be
vendored back, the same way the dark palette is.

### 3. A token that the site needs but does not define

- `--color-accent-text` — `#00d4aa` measures 1.9:1 on white and cannot carry
  text. In dark mode it equals the accent; in light mode it is a darker step.
  Use it for text and links, and `--color-accent` for fills, borders and active
  states.

Plus `--color-on-accent` (ink on an accent fill) and `--color-code-surface`,
which is an alias rather than a value: it resolves to the site's
`--color-terminal-bg`, because docs is full of code blocks and none of them is a
transaction log. The colour decision stays the site's; only the name is local.

### 4. Accent-filled controls carry an accent-text border

In light mode the accent fill only reaches 3:1 against white, and the hover
fill is lighter still. A `--color-accent-text` border means the control
boundary clears 3:1 at rest *and* on hover regardless of the fill. Harmless in
dark mode.

### 5. The brand mark is inverted in light mode

`antidrain-mark.png` is a pure-white alpha silhouette — the site only ever shows
it on a near-black page, so it was never a problem there. On a white docs
background it disappeared completely. Because the artwork is monochrome, a
plain `filter: invert(1)` produces an exact black mark with the alpha channel
intact, so there is no filter chain to tune and no second asset to keep in
sync. If the mark ever becomes multi-colour, this needs a real light-mode
asset instead.

Not ported: the site recolours the mark to accent on hover via `mask-image`. That
needs an overlay element VitePress's logo markup does not give us, and it is
decoration rather than a correctness issue.

### 6. VitePress's z-index scale is not mapped

The site's `--z-*` tokens describe a different component set, and VitePress's
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

### 8. One forced-colours rule of our own

The vendored block already carries the site's forced-colours work: it remaps the palette onto
system colours, and it repairs the "primary button loses its label" collision for a list of site
component classes. That second fix **cannot** reach this repository. Its selector list is
`.wa__btn--primary`, `.ac__withdraw` and friends, none of which exist here; and both halves of the
collision here are docs-only tokens (`--color-accent-text`, `--color-on-accent`) that the site has
never declared. So `tokens.css` carries one docs-only rule below the deviation marker, for the one
control in this theme that reproduces the pattern.

The control is the header CTA, `.VPNavBarMenu .VPNavBarMenuLink` in `prose.css` — the workspace
link — built as `background: var(--color-accent); color: var(--color-on-accent)`. In the **dark**
theme the remap sends the fill to `CanvasText` and `--color-on-accent` resolves through
`--color-bg-primary` to `Canvas`. `Canvas` is also the colour Chromium paints its backplate behind
every glyph, so the label is painted onto a plate of its own colour and vanishes, leaving a blank
pill. `getComputedStyle` reports `background: CanvasText; color: Canvas` throughout — 21:1 on
paper — so **only decoded pixels can see this**. Measured as distinct colours in the label's own
text-node crop: **3 (RU) and 2 (EN) while lost, 241 and 221 after the rule**, against 248–408 for
labels on the same page that were never filled.

Two places this deliberately differs from the site's version of the same fix, both because this
control is a bordered `<a href>` rather than a borderless `<button>`:

- **`LinkText`, not `CanvasText`.** The control is a link, and `LinkText` is what tells a
  forced-colours user so. It also leaves the light theme's rendering byte-identical.
- **No inset ring.** The site adds `outline: 2px solid CanvasText; outline-offset: -3px` because
  removing the fill leaves its buttons with no boundary at all. This control already carries
  `border: 1px solid var(--color-accent-text)`, which resolves to `CanvasText`, so the boundary
  survives on its own — and an `outline` here would outrank `:focus-visible`'s `Highlight` ring at
  the moment it is the only thing telling a keyboard user where they are.

Focus is **not** excluded from the rule, unlike the vendored ARIA-state rule above it: what the
rule sets is the colour pair that makes the label readable at all, and a focused control with no
label is the same defect. Since it sets no `outline`, the focus ring is untouched either way.
`:not([inert]):not([hidden])` is specificity padding and nothing else — the component's own
`:hover` rule is (0,3,0) and `tokens.css` loads *before* `prose.css`, so matching that specificity
would lose the tie on source order. Dropping the padding was verified to reproduce the defect.

Two measured facts worth not re-discovering:

- **The light theme never sees the remap at all.** It lives on `:root` (0,1,0) and `light.css`
  overrides the same tokens on `:root:not(.dark)` (0,2,0), so in the light theme `--color-accent`
  stays `#00a982` and `--color-on-accent` stays `#04110e`. Those are author colours, which is
  exactly what Chromium's own `forced-color-adjust` is for, and it maps them to a legible pair
  without help — every candidate measured clean. **This is not a bug to fix casually:** repairing
  the specificity would move the light theme onto the same system-colour pairs as the dark one and
  therefore into the same collision, so it needs its own measurement pass, not a one-line edit.
- **Masked icons disappear in this mode, and no `color` rule can save them.** VitePress draws the
  external-link arrow as `background-color: currentColor` plus a `mask-image`, and forced colours
  rewrites every author `background-color` to `Canvas` regardless of what `currentColor` resolves
  to. Measured flat both with and without a `color` declaration aimed at it, so `tokens.css`
  carries none. Every masked icon in the theme is affected the same way; that is a separate defect
  class from this one and wants its own sweep.

`check:layout` protects the rule with a forced-colours pass — see `TESTING.md`.

## Callouts

Callouts use the site's status-surface formula: 1px hairline in `-border`, fill in
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

Search is present and working on every real docs page. If the picker ever
grows into a searchable page, the fix is to make `/` part of a real locale
rather than to re-enable a control over a one-page index.

## Accessibility rules carried over from the site

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
the analogue of the site's `checkDesignTokens.mjs` and
`checkInteractionAffordances.mjs`.
