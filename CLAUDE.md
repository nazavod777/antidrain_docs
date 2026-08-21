# CLAUDE.md

All project rules live in [AGENTS.md](AGENTS.md). Read it first. This file only
adds what is specific to Claude Code, and is deliberately short — rules belong
in `AGENTS.md`, not here.

## Specific to Claude Code

- **Talk to the user in Russian.** Code, identifiers, comments, commit messages
  and this repository's own documentation stay in English.
- `npm run lint` is the fast loop — about a second, no build. Use it while
  editing. Run `npm run build` before reporting anything as done.
- `npm run build` needs a Chromium for `check:layout`. If Playwright's own
  browser is missing, point `PLAYWRIGHT_CHROMIUM_PATH` at a system one.
- Verify visual changes in a real browser at the widths `AGENTS.md` lists, in
  both themes. Note that `vitepress preview` resolves extensionless URLs
  differently from GitHub Pages — `DEPLOY.md` explains how to serve `dist` the
  way production does.
- Do not commit unless asked.
