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
is a separate repository, not part of this checkout; if it is missing, you
have the repository but not its siblings. What this repository must keep in
step with the product: the fee figures quoted to users, the action names, the
six workflow step names, and the vendored `tokens.css`. The gate is
`node ../scripts/check-ecosystem.mjs`.

## Read these first, and do not duplicate them

| File | Owns |
| --- | --- |
| `README.md` | Repo layout, quick start, and the one-line version of the editing rules |
| `DESIGN_SYSTEM.md` | Tokens, the two themes, every deliberate deviation from the site, callout anatomy, why search is scoped per locale |
| `DEPLOY.md` | CI, GitHub Pages, what each check protects, the `vitepress preview` URL-resolution trap |
| `TESTING.md` | The tier table, the trigger for every check and every manual pass, and the twelve ways the map can be wrong |

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
`../antidrain_site/src/constants/translations/*.ts`. Do **not** read anything
under `../antidrain_site/public/translations/` — everything there is build
output, written from those catalogs by the site's
`scripts/writeWorkspaceTranslations.mjs`, which its build runs before Vite.
**The rule is the directory and the generator, not a file name**, because the
file names have already changed once: a single combined `workspace.json` became
one file per locale, and the old path stopped existing. Quote the `.ts` source
and the next reshuffle costs you nothing.

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
an action: "Donor Asset Withdrawal" / "Вывод активов с донора". Retiring the donor
is a sixth flow and likewise not an action: "Erase donor wallet" / "Стереть
кошелёк донора" — the same button on two surfaces, the donor step and the send
controls, opening a confirmation whose second point differs by surface and whose
third depends on whether the browser keeps pasted keys; everything else about it
is shared. Replacing the donor is a seventh flow, also not an action: "Replace
the donor wallet" / "Заменить кошелёк донора" — the confirmation that **Generate
Wallet** and **Import Wallet** open when this browser may already be holding a
donor. **It is not an erase, and these pages must never call it one.** The site's
own test for what the finality gate guards is not "does this control delete the
donor" but "can the donor key stop being recoverable after it", and writing a new
wallet over the stored one answers yes. Four controls are guarded, not two: the
erase on either surface, the session wipe on the send step, and this pair.

- One concept, one name, everywhere, in both languages. If you find two names
  for one thing, that is a defect — fix it or report it, do not add a third.
- `chain ID` is never translated into Russian; the product keeps it Latin.
- Keep a term in English only when it is literally an on-screen label. A term
  that has a Russian equivalent the product itself uses gets the Russian one.

## Repo invariants

These break silently — nothing tells you until a shared link 404s or the two
languages have quietly diverged. Several of them already have.

- **A heading is a URL.** `check:slugs` holds every anchor the previous GitBook
  site already deployed. Adding headings is fine; changing existing
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
- **Adding a page is three edits in `docs/.vitepress/pages.ts`**: `GROUPS`,
  `LABELS.ru.pages`, `LABELS.en.pages`. A missing label used to render
  `undefined` and generate no rewrite, silently; the module now asserts both
  locales on import, so the build fails and names the key. `pages.ts` is the
  one page list — `config.ts`, `check:urls`, `check:layout` and `check:slugs`
  all read it, and none of them keeps a second copy.
- **A new page also needs an anchor contract.** It has no GitBook past, so
  `check:slugs` fails until it is declared in that script's
  `POST_MIGRATION_PAGES` with a reason and recorded with
  `npm run check:slugs -- --record`. That is the point: a page nobody declared
  cannot slip through uncovered.
- **No colour literal outside `theme/tokens.css` and `theme/light.css`.**
  `!important` appears in exactly one place in the theme — the reduced-motion
  blanket in `base.css`, where an accessibility override has to beat every
  author rule. Anywhere else, use specificity.
- `check:slugs`, `check:anchors`, `check:urls` and `check:layout` need
  `--experimental-strip-types` — they import `slugify.ts` and `pages.ts`.
- `check:urls` and `check:layout` read `dist/`, so they only run after a build.
- **Every check ships a `--self-test` and runs it immediately before the real
  check, inside the same npm script name.** So each script is a pure core plus
  a thin `main()`, and none of them calls `process.exit` — they set
  `process.exitCode`. A self-test that would need a build, the network or a
  browser does not belong in the fast loop, which is why `check:layout`'s is
  pure by construction. When you add a rule, add the `expectFailure` case for
  it in the same edit. The test map audits this pairing as `self-test-drift`,
  so a check that quietly lost its self-test fails the fast loop.
- **A new path needs a rule before it needs anything else.** Every path this
  repository owns is claimed by a rule in `scripts/testMap.mjs` or by a
  `NO_TESTS` entry with a reason, and `npm run lint` fails on any that is
  neither. Adding a check means an entry in `SCRIPTS` and a rule pointing at its
  own source, or the audit reports `unreachable-check`: the fast loop cannot be
  the answer for a check the fast loop does not contain.
- `check:layout` takes `--page <url>` and `--changed <path>` to narrow the run
  to the pages a change could have touched. It narrows the set of **pages**,
  never the set of checks per page, and prints what it did not do. It is not
  the gate — see `DEPLOY.md` under "Named gaps".
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
| `npm run lint` | Fast loop: contrast + anchor contract + RU/EN parity + anchor links + the test-map audit. ~0.6s, no build |
| `npm run test:for` | Which checks can see the change you just made, and what it leaves out. Runs nothing |
| `npm run build` | Everything: `lint`, the VitePress build with its dead-link check, redirect stubs, `check:urls`, `check:layout` |
| `npm run preview` | Serve the built output |
| `npm run tokens:check` | Local only: diff `tokens.css` against the site. Needs `ANTIDRAIN_SITE` |
| `npm run screenshots` | Regenerates the UI screenshots from a live site. Local only; review every image before committing |
| `npm run og-image` | Regenerates the social preview card. Reproducible; look at the result before committing |

## Which check sees what — ask, do not remember

```bash
npm run test:for                          # the working tree against HEAD
npm run test:for -- docs/ru/glossary.md   # these paths instead
npm run test:for -- --why <path>          # which rules claim one path, and why
```

**[`TESTING.md`](TESTING.md) is the tier table, the triggers and the manual
checks.** `scripts/testMap.mjs` is the data behind it, one stated reason per
rule, and its audit runs inside `npm run lint` — a map that stopped being true
goes red instead of confidently sending you to the wrong check. The tables are
deliberately not repeated here; a second copy is a copy that rots.

The value is not speed — `npm run lint` is already under a second. It is
escalation and radius: that `theme/tokens.css` also feeds `og-image`, and that
`docs/index.md` is read by no structural check at all, because `check:parity`,
`check:slugs` and `check:anchors` each scan `docs/ru/` and `docs/en/` and
nothing else. If it exits `2`, a path exists that no rule claims — add the rule
or a `NO_TESTS` entry with a reason before trusting any narrow run.

The command is `test:for` in all three repositories even though this one says
`check:`. One command has to work in any of the three checkouts; a local synonym
would be a second name for one thing. The output speaks the local language.
`TESTING.md` carries the same seven headings in all three — `INV-13`.

## Verification

- Run `npm run lint` while editing, `npm run build` before reporting anything
  as done. "Done" means the build passed, not that the edit looked right.
- `npm run test:for` tells you which checks the change reaches and prints what
  it is skipping. Report that list; do not reconstruct it from memory.
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
