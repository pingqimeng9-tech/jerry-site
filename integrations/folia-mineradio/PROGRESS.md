# Folia x Mineradio Handoff

Updated: 2026-11-02

## Goal and constraints

Build one Folia-powered Cine Stage that combines Folia playback, lyrics and audio signals with Mineradio-inspired particles, cinematic camera motion, a 3D queue shelf and Open-Meteo weather. Do not import Mineradio's server, account, provider or audio-source code. Do not alter the existing `/listen/` or `/player/` entries. Work only on `feature/folia-mineradio-cinema`; do not commit to `main`. Never include credentials, cookies or `.env` files.

## Repository state

- Workspace: `/workspaces/jerry-site`
- Branch: `feature/folia-mineradio-cinema`
- Branch base: `e1db6ef` (`Fix vinyl arm motion and Folia lyric loading`); `main` and `origin/main` remain at this base.
- Current workspace changes are untracked directories: `integrations/`, `site/listen/fusion/`, and `site/player-fusion/`.
- No fusion commit has been made or pushed yet.
- The old `/listen/`, `/listen/desktop.html` and `/player/` files have not been edited on this branch.

## What exists

- `integrations/folia-mineradio/LICENSE`: AGPL-3.0 text for the combined player source.
- `integrations/folia-mineradio/source/src/components/visualizer/mineradioCine/`: Cine visualizer source (`entry.tsx`, `MineradioCine.tsx`, `scene.tsx`, `cine.css`). It consumes Folia visualizer props for bands, power, lyric clock/lines, the active provider's playlist collections, and playlist-open navigation; it contains the Open-Meteo client and mobile light mode.
- `integrations/folia-mineradio/README.md` and `THIRD-PARTY-NOTICES.md`: build/deploy/licensing notes.
- `integrations/folia-mineradio/LICENSES/MINERADIO-GPL-3.0.txt`: archived Mineradio GPL-3.0 text.
- `integrations/folia-mineradio/source/scripts/apply-folia-cine.mjs`: reproducible overlay patch (playlist contract); verified to apply cleanly against Folia 0.7.21 upstream commit `26c57f9`.
- `integrations/folia-mineradio/source/scripts/generate-fusion-icons.mjs` and `source/src/fusion/dynamicIconImports.ts`: fusion-only icon-chunk reduction helpers.
- `site/player-fusion/`: an existing approximately 30 MB Folia build output, including `MineradioCine-*.js` and `MineradioCine-*.css` chunks.
- `site/listen/fusion/index.html` and `desktop.html`: copied mobile/desktop shells pointing at `/player-fusion/assets/main-93bGXFXF.js`; their mutual layout switch stays within `/listen/fusion/`.
- `site/player-fusion/LICENSE`: AGPL-3.0.

## Done (2026-11-02)

- Playlist-shelf source completed: the shelf now renders the active provider's `ProviderCollection[]` and opens a collection through Folia's existing `createOnlineGridViewCollection` + `openHomeCollection`; playback queue is no longer used as the shelf.
- `apply-folia-cine.mjs` updated to the playlist contract and verified against a clean Folia 0.7.21 checkout at commit `26c57f9`.
- Bundle rebuilt from `playlist` source: `FOLIA_CINE_BUILD=1 npx vite build --base=/player-fusion/ --outDir=.../site/player-fusion` succeeded (~24s). The output was cleaned first and the AGPL license restored, so the bundle is ~20 MB with one consistent set of hashed assets.
- The two fusion shells now reference the rebuilt main `main-DQe-buPb.js`; `onOpenPlaylist` and `/listen/fusion` route markers are present in the rebuilt chunks.
- Vercel `no-store` headers for `/listen/fusion/` and `/listen/fusion/desktop.html` are in `vercel.json`.
- Secret scan, `node --check` on both scripts, `git diff --check` and JSON validation passed.

## Verification evidence

- `npx playwright test tests/folia.spec.js -g "Folia Cine fusion route renders" --workers=1 --reporter=line` → 2/2 passed (desktop + mobile), after the playlist rebuild.
- Full `npx playwright test tests/folia.spec.js --workers=1 --reporter=line` (before the rebuild) → 11 passed, 9 skipped by device condition, 0 failed.
- The fusion smoke test mocks Open-Meteo and checks the weather UI without network dependence.

## Still open before release

- The full suite has not been rerun after the playlist rebuild; the focused fusion test has. Rerun the full suite and both old routes once more on a machine that can run Playwright.
- Live playback lyric updates, playlist-open navigation, weather-denied/offline states, and real-device mobile/desktop visual polish are not yet covered by automated tests.
- The 3D shelf is rendered from Folia collections, but `PROGRESS.md` earlier wording still described a queue shelf; the source is the source of truth.
- No commits have been made yet; everything remains untracked/modified on `feature/folia-mineradio-cinema`.

## Licensing

- Folia source at the pinned revision declares AGPL-3.0; the shipped Folia bundle has `site/player/SOURCE.txt` and `site/player/LICENSE`.
- Mineradio's repository resolves to `XxHuberrr/Mineradio-paused`; its `LICENSE` and README declare GPL-3.0. GitHub API metadata says `NOASSERTION`, which conflicts with the checked-in license text.
- GPL-3.0 compatibility with AGPL-3.0 is handled under GPLv3 section 13. Keep Mineradio's attribution/notice, identify copied or adapted files, and license the combined player source/output under AGPL-3.0. Do not add a root license that would unexpectedly relicense the blog/CMS.
- Mineradio NOTICE reserves its name, logo and original product visual identity. Do not copy its branding/assets; use the newly designed Folia Cine visual treatment.

## Next actions

1. Inspect both fusion HTML shells and `site/player-fusion/index.html`; verify all asset paths, viewport adaptations, service worker behavior and that no old vinyl script is loaded.
2. Verify whether the built app selects `cine` on `/listen/fusion/`. If not, add and preserve the route-forcing patch in the pinned Folia source; it must not write shared visualizer preferences. Rebuild only the isolated `/player-fusion/` output.
3. Add a desktop/mobile Playwright smoke test that asserts the Cine stage is visible, the mobile light mode is active, lyrics use Folia's timeline, and a queue selection calls Folia's existing `playSong` handler.
4. Add integration README and third-party notices, Vercel cache/service-worker notes, and make the source/build reproducible.
5. Run focused tests, source typecheck if memory permits, secret scan and `git diff --check`; inspect that old routes/files are unchanged.
6. Make small commits and push only `feature/folia-mineradio-cinema` after tests. Keep `main` untouched.

## Useful commands

```sh
cd /workspaces/jerry-site
git status --short --branch
git diff --check
npx playwright test tests/folia.spec.js --workers=1
```

The earlier Folia full-project typecheck and Vite full build were killed under the container memory limit. Do not interpret those as passing. Prefer a narrow typecheck, and serialize heavyweight builds/tests.