---
name: website-quality
description: Use when optimizing callmiruko.cc or similar static/Node sites, especially the blog, template library, article demos, category migrations, and visual interactions; enforces 1:1 source copying, data preservation, stack/overflow debugging, swipe-card demos, and live desktop/mobile verification.
---

# Website Quality Guardrails

This skill is a pre-flight and verification checklist for high-quality website changes. It is based on mistakes made while rebuilding this site.

## Non-negotiable rules

1. **Never delete existing templates, cards, routes, or features to make one preview look right.** Restore missing work first, then verify the live count. The template library must stay at 30 unless the user explicitly asks to remove templates.
2. **Copy the source of truth 1:1.** When the user says “copy the blog folder”, use the actual blog markup/CSS/behavior, not a redesigned version. Do not add title bars, search, galleries, extra folders, or invented controls.
3. **Keep the user's color direction.** “Normal colors” means no grayscale filter. Never add monochrome/desaturation unless requested.
4. **Preserve content and data.** Category merges use alias mapping, not deletion. Keep every published post, slug, cover, tag, and annotation. Do not commit view-count changes created by local tests.
5. **Fix clipping at the source.** Before changing z-index, inspect `getBoundingClientRect`, computed `overflow`, parent stacking contexts, and transforms with Playwright. A card inside an `overflow:hidden` shell is clipped regardless of z-index.
6. **Demos must actually demo.** A homepage/template preview should auto-run its motion when the gallery provides `auto`; direct hash pages may need a fallback timer. Verify the real rendered result, not only the code.
7. **Article demos use one card at a time.** Unless the user asks otherwise, use a horizontal swipe deck: one full-width numbered card, before/after comparison, a short “how to change” note, arrows, dots, keyboard support, native touch swipe, and mouse drag. Do not replace it with a tabbed grid.
8. **Do not auto-advance article cards.** Let the reader choose the card; animation inside a card is fine.
9. **Only edit the requested surface.** A blog/template request does not authorize changes to unrelated pages. Preserve other 29 templates and existing interactions.
10. **No secrets, no test artifacts, no stray files.** Never commit `pasted`, `vhc`, screenshots, test-results, or credentials.

## Required workflow

1. **Read before editing.** Find the source view, data file, renderer, and existing tests. Identify the exact DOM/CSS source the user refers to.
2. **Plan the smallest safe diff.** Data migration separate from presentation. One concern per commit.
3. **Implement with progressive enhancement.** Content lives in Markdown/JSON; behavior goes in a small asset (for example `site/assets/article-deck.js`); initialize after the Markdown renderer injects HTML.
4. **Test in a real browser at desktop and mobile widths.**
   - Check visible cards, overflow, clipping, stacking, swipe/drag, arrows, dots, keyboard, and reduced-motion.
   - Take a screenshot and inspect it; a passing DOM assertion can still ship a visually broken card.
5. **Run targeted tests, then the full suite.**
   - `npx playwright test tests/blog.spec.js --reporter=line`
   - `npx playwright test --reporter=line`
6. **Clean test mutations.** Restore test-generated `views` and any data changes that are not intentional before committing.
7. **Commit and deploy only requested files.** Check `git status`, `git diff --stat`, and recent commits first.
8. **Verify the live deploy with cache-busting.** Use `?v=<commit>` before the hash, for example `https://callmiruko.cc/?v=abc1234#folderblog`; never put the query after `#`.
9. **Report concisely in Chinese.** State what changed, what was verified, commit hash, and live links. Mention unresolved risks honestly.

## Site-specific notes

- Blog categories: legacy aliases `心情随笔`, `心情`, `思维日记`, `思维`, `建站笔记`, `建站`, and `未分类` map to `学会成长`. Keep `技术分享` and locked `Rumi英语技术`.
- Blog tests expect 10 cards in each view and no `music.163.com` requests. Update category test counts when categories merge.
- Article deck: markup uses `[data-deck]`, `[data-track]`, `[data-card]`; initialize with `window.initArticleDecks(root)` after `marked.parse`.
- Template previews are mounted by `site/assets/index-runtime.js`; `ctx.demo` only fires when the gallery sets `auto`, so direct standalone views need a fallback.
- A folder card's chapters must sit outside the `overflow:hidden` shell and share the front panel's stacking context. Keep the third card clickable.
- Do not use `git checkout -- site/data/posts.json` after adding content; targeted resets of `views` are safer.

## Definition of done

- The requested behavior is visible in a real screenshot at 1440px and 390px.
- Existing templates/features are still present and counted.
- The article’s swipe deck shows exactly one card, can switch in both directions, and has working arrows/dots/keyboard.
- No horizontal page overflow, no clipped cards, no console errors.
- Full test suite passes or all remaining failures are explained.
- Live URL verified after deployment and cache-busting.
