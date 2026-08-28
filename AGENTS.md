# AGENTS.md — Instructions for AI Coding Agents

## Project

Source for [docs.antidrain.me](https://docs.antidrain.me) — the documentation
for AntiDrain, a browser-based EVM wallet rescue workspace. VitePress, Russian
and English, kept as a matched pair: every page exists in both languages, and
`check:parity` enforces it. The page count is deliberately not written down
here — it changed three times without this line noticing.

**Audience: people with no blockchain knowledge at all**, frequently reading
this mid-incident because their wallet is already compromised. A change is done
when such a reader can act on it — not when it is technically correct. Treat
that as an acceptance criterion, not a preference. If a change makes the text
accurate but leaves a newcomer unable to take the next step, it is not finished.

The product is a separate repository: `../antidrain_site`. It is the source of
truth for behaviour and for vocabulary. Never invent a name for something the
product already names.

There is a third repository, `../antidrain_extension` — a rescue-first browser
wallet built on the same rescue logic. **These docs do not cover it yet.** Every
page here describes the site. The word "extension" appears in these pages only
as a threat — a malicious browser extension — so do not let the two senses blur,
and do not describe wallet-extension behaviour from memory. Writing that
documentation is outstanding work, not a gap in the site's coverage.

The map of the three repositories, and the procedure for a change that touches
more than one of them, live in **`../AGENTS.md`** in the parent directory. That
is a separate repository, not part of this checkout. What this repository must keep in step
with the product: the fee figures quoted to users, the action names, the six
workflow step names, and the vendored `tokens.css`. The gate is
`node ../scripts/check-ecosystem.mjs`.

## Read these first, and do not duplicate them

| File | Owns |
| --- | --- |
| `README.md` | Repo layout, quick start, and the one-line version of the editing rules |
| `DESIGN_SYSTEM.md` | Tokens, the two themes, every deliberate deviation from the site, callout anatomy, why search is scoped per locale |
| `DEPLOY.md` | CI, GitHub Pages, what each check protects, the `vitepress preview` URL-resolution trap |

If a rule already lives in one of those, link to it instead of restating it — a
second copy is a second thing to drift. The one deliberate exception is the
invariants below: a few of them also appear in `README.md` in short form,
because an agent must meet them in the main rulebook rather than discover them
later. Where they overlap, this file carries the mechanism and the consequence,
and `README.md` carries the one-line version.

`CLAUDE.md` is derived from this file. Rules go here; that file only carries
what is specific to Claude Code.

## Product vocabulary — copy it, do not invent it

Take strings from the TypeScript catalogs in
`../antidrain_site/src/constants/translations/*.ts`. Do **not** read
`public/translations/workspace.json` — it is generated from `workspace.ts`.

The six workflow steps, in order (`src/types/workflow/primitives.ts`,
`src/components/StepNav/StepNav.tsx`):

| # | EN | RU |
| --- | --- | --- |
| 1 | Donor Wallet | Кошелёк донора |
| 2 | Select Action | Выбор действия |
| 3 | TX Builder | Конструктор транзакций |
| 4 | TX Simulator | Симулятор транзакций |
| 5 | Fund Donor | Пополнение донора |
| 6 | TX Sender | Отправка сценария |

The four rescue actions — there are exactly four, `ActionType` is a closed
union (`removeDelegation | customBatch | permitRescue | debankWithdraw`):

| EN | RU |
| --- | --- |
| Remove Delegation | Удаление делегирования |
| Custom TX Builder | Конструктор Custom TX |
| Permit Rescue | Спасение через Permit |
| DeBank Withdraw | Вывод через DeBank |

Note the collision and keep it straight: **step 3 is "TX Builder", the action
is "Custom TX Builder"**. They are different things — step 3 hosts whichever
panel matches the chosen action. Donor asset sweeping is a fifth flow but not
an action: "Donor Asset Withdrawal" / "Вывод активов с донора".

- One concept, one name, everywhere, in both languages. If you find two names
  for one thing, that is a defect — fix it or report it, do not add a third.
- `chain ID` is never translated into Russian; the product keeps it Latin.
- Keep a term in English only when it is literally an on-screen label. A term
  that has a Russian equivalent the product itself uses gets the Russian one.

## Repo invariants

These break silently — nothing tells you until a shared link 404s or the two
languages have quietly diverged. Several of them already have.

- **A heading is a URL.** `check:slugs` holds 224 anchors that the previous
  GitBook site already deployed. Adding headings is fine; changing existing
  heading text is not. If it must be reworded, pin the old anchor:
  `## New text {#old-anchor}`.
- **Frontmatter is exactly `title` and `description`.** Nothing else. The only
  exception is `docs/index.md` (`layout`, `sidebar`, `aside`).
- **Same-page links use the transliterated ASCII slug**, not the Cyrillic
  heading: `[Кнопка недоступна](#knopka-nedostupna)`. The transliteration lives
  in `docs/.vitepress/slugify.ts` and is the only copy — GitBook carried three
  and they had to stay byte-identical. `check:anchors` verifies every
  `#fragment` resolves; VitePress checks the page but not the fragment.
- **Cross-page links are absolute and locale-rooted**: `/ru/quick-start`. Never
  `quick-start.md` — pages are rewritten into directories and the build fails
  on dead links.
- **RU and EN are edited as a pair.** `check:parity` compares structure —
  heading levels, table shapes, images, and callouts by type, order **and what
  they wrap**. It also fails any callout without a title (an untitled
  `::: danger` renders the English word "DANGER" on a Russian page) and any
  image without alt text.
- **Adding a page is three edits in `docs/.vitepress/config.ts`**: `GROUPS`,
  `LABELS.ru.pages`, `LABELS.en.pages`. Miss a label and it renders
  `undefined` and no rewrite is generated for the page.
- **No colour literal outside `theme/tokens.css` and `theme/light.css`.**
  `!important` appears in exactly one place in the theme — the reduced-motion
  blanket in `base.css`, where an accessibility override has to beat every
  author rule. Anywhere else, use specificity.
- `check:slugs` needs `--experimental-strip-types` — it imports `slugify.ts`.
- `check:urls` and `check:layout` read `dist/`, so they only run after a build.
- `docs/.vitepress/dist` and `cache` are gitignored. Never commit them.

## Cross-platform

- Mobile-first. Base styles for the smallest width, extend with `min-width`.
- Breakpoints: `480 / 768 / 1024 / 1440`. Two more are load-bearing here:
  **960px** (VitePress turns the sidebar into a drawer) and **1280px** (the
  theme switch and social links appear).
- Verify at `390 / 480 / 768 / 1024 / 1280 / 1440`, in **both** themes.
- **Horizontal page scroll is 0px at every width.** A wide block scrolls inside
  its own container — tables use `.vp-table-scroll`. The page body never
  scrolls sideways.
- **Touch targets: 44×44 minimum.** `DESIGN_SYSTEM.md` states the
  `pointer: coarse` rule; below 960px there is a second, width-based rule as
  well, because `pointer` cannot be emulated headlessly and only the width rule
  is testable. Keep both.
- Last 2 versions of Chrome, Firefox, Safari, Edge, plus iOS Safari. No
  hand-written vendor prefixes.
- No layout may depend on a hover state alone; touch has no hover.

## Accessibility

The focus, outline, touch-target and reduced-motion rules live in
`DESIGN_SYSTEM.md` under "Accessibility rules carried over from the site", and the
contrast thresholds are enforced by `check:contrast`. Read them there. What this
file adds:

- **WCAG 2.1 AA is the floor**, in both themes, on every page type.
- **axe reports zero violations** for `wcag2a wcag2aa wcag21a wcag21aa`.
  `check:layout` enforces this, so an a11y regression fails the build.
- Native semantics over ARIA. Reach for ARIA only when no element fits — the
  sidebar's `nested-interactive` violation came from a `role="button"` that
  VitePress adds when a sidebar group is made collapsible.
- Every image needs `alt`; decorative ones get `alt=""` and `aria-hidden`.

## UI/UX

- Transitions 150ms (state changes) and 250ms (entrances), `ease-out` — the
  site tokens `--transition-fast` and `--transition-base`. Nothing else.
- Max 3 clicks from any entry point to any page. The sidebar is grouped for
  exactly this reason; a page nobody can reach in three is filed wrong.
- Every interactive element has a visible hover, active, focus and disabled
  state. A disabled control explains why it is disabled — the product treats
  that as a hard rule (`antidrain_site/docs/DISABLED_BUTTON_TOOLTIPS.md`).
- Both themes are mandatory and both get checked. Dark is the default.
- **Do not offer a control that cannot work.** The root page hides search
  because its locale index holds one page — see `DESIGN_SYSTEM.md`.

## Commands

| Command | Use |
| --- | --- |
| `npm run dev` | Dev server, hot reload |
| `npm run lint` | Fast loop: contrast + anchors + RU/EN parity. ~1s, no build |
| `npm run build` | Everything: `lint`, the VitePress build with its dead-link check, redirect stubs, `check:urls`, `check:layout` |
| `npm run preview` | Serve the built output |
| `npm run tokens:check` | Local only: diff `tokens.css` against the site. Needs `ANTIDRAIN_SITE` |
| `npm run screenshots` | Regenerates the UI screenshots from a live site. Local only; review every image before committing |
| `npm run og-image` | Regenerates the social preview card. Reproducible; look at the result before committing |

## Verification

- Run `npm run lint` while editing, `npm run build` before reporting anything
  as done. "Done" means the build passed, not that the edit looked right.
- For any visual change, look at it in a browser at the widths above, in both
  themes. Screenshot against the equivalent site page when the change is about
  matching the product.
- After touching tokens, run `npm run tokens:check`.
- When you add a check, prove it fails: break the thing on purpose, confirm the
  failure message names the real cause, then revert.
- Report what you verified and what you did not. Never describe an unrun check
  as passing.

## Git

- Branch from `main`. Do not commit unless asked.
- Never commit `node_modules`, `dist`, `cache` or editor directories.
- Commit subjects follow the existing history: short imperative sentences.
