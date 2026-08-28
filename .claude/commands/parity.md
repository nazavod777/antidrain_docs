---
description: "Check that RU and EN still say the same thing, and that both still match the product."
argument-hint: "[path or term]"
allowed-tools: Bash, Read, Glob, Grep
---

Subject: **$ARGUMENTS** — a page, a directory, or a term. Empty means the whole tree.

Run `npm run check:parity` first. It is structural: it proves the two language trees have the same
pages and the same headings. **It cannot read.** Everything below is the part a script cannot do.

## The two questions

**1. Do RU and EN say the same thing?** Not word for word — the same claim, the same order of
steps, the same warnings. A sentence added to one language and not the other is the normal way this
repository goes wrong, because each edit feels complete on its own. If the pair genuinely cannot
say the same thing, the difference is a deliberate one and belongs in the text, not in a gap.

**2. Does either of them still match the product?** The site is the behavioural source of truth for
every rescue flow. A step that no longer exists, an action renamed, a label reworded — the
documentation keeps describing the old one and reads as correct. Check the claim against
`../antidrain_site`, not against memory.

That second question is `INV-5` (the four rescue actions) and `INV-6` (the six workflow steps) in
`antidrain_web/AGENTS.md`. The normative term list in this repository's `AGENTS.md` is what both
languages must draw from — a synonym introduced here is a third name for something that already
has two.

## What to report

Name the pages, the language that is behind, and for each difference say whether it is a **missing
translation**, a **drift from the product**, or **deliberate**. Do not fix a drift from the product
by editing the documentation until you have confirmed which side is wrong: if the site changed
without this repository being updated, that is the site's `CR-4`, and the words here may be
describing the behaviour that was actually intended.
