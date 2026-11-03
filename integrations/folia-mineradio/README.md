# Folia Cine Stage

Folia Cine Stage is an isolated Folia visualizer that combines Folia's existing playback, lyrics timeline and analyser signals with a new cinematic particle field, camera motion, queue shelf and an Open-Meteo weather readout.

## Runtime boundaries

- Folia remains the only owner of audio sources, playback, login, search, playlists and queue state. The Cine renderer consumes Folia's existing `audioBands`, `audioPower`, beat envelopes, lyric clock, current song and queue props. It does not create an `AudioContext`, attach a second `MediaElementAudioSource`, or introduce a Mineradio backend.
- The new mobile and desktop shells are `/listen/fusion/` and `/listen/fusion/desktop.html`. They load the separately built `/player-fusion/` bundle. The existing `/listen/`, `/listen/desktop.html` and `/player/` bundle are retained as rollback entries.
- The fusion route selects the `cine` visualizer in memory from the route. It does not write `localStorage.visualizer_mode`, so it will not change the original Folia entry's saved mode.
- Desktop uses the 3D queue shelf and full particle field. Small screens, `saveData`, low device memory and reduced-motion preference use the light particle/lyrics scene.
- Weather requests go directly from the browser to Open-Meteo and need no API key. The default weather location is Shanghai; the user may request browser geolocation. If weather is unavailable, the player remains usable.

## Source and build

The checked-in renderer and the overlay helper live in `source/`. `scripts/apply-folia-cine.mjs` applies the integration to a separate Folia source checkout and refuses an unexpected Folia version or already-patched files. It never writes to this repository's old `site/player/` tree.

The deployed Folia bundle currently identifies as version 0.7.21. Its documented source base is `26c57f9b1b26b402a09e8943171a332215418ce6`; see `../../site/player/SOURCE.txt` and `../../site/player/PATCHES.md` for the site adaptations that must be present in the checkout. The build patch is intended to be applied after those site adaptations.

Example, from an isolated Folia checkout with those site patches applied:

```sh
npm ci
node /path/to/jerry-site/integrations/folia-mineradio/source/scripts/generate-fusion-icons.mjs .
node /path/to/jerry-site/integrations/folia-mineradio/source/scripts/apply-folia-cine.mjs .
FOLIA_CINE_BUILD=1 npx vite build --base=/player-fusion/ --outDir=/path/to/jerry-site/site/player-fusion
```

The icon generator writes `src/fusion/cineIconData.generated.json` in the Folia checkout. It is generated build input, not a credential. Do not copy `.env`, cookies, account data, private API keys or local user data into the repository or deployment artifact.

Folia's full build is memory intensive. Run it serially and verify the build exits successfully before replacing a bundle. Do not treat pre-existing files in `site/player-fusion/` as proof that the current source rebuilt successfully.

## Deploy on Vercel

Deploy the feature branch as a Vercel Preview first. `vercel.json` gives the two fusion HTML routes `Cache-Control: no-store`; the hashed `/player-fusion/assets/` files remain cacheable. Verify both fusion URLs and the original `/listen/` and `/player/` URLs in the preview deployment before merging. The main branch and old bundle should not be overwritten as part of this feature branch.

## Verification status

The route smoke test covers desktop and mobile stage mounting, mobile lightweight mode and viewport overflow. See `PROGRESS.md` for the exact last test result and remaining checks. Live playback, lyric updates, queue selection, weather-denied/offline states, service-worker isolation, the full Folia test suite and a fresh reproducible bundle build must all be checked before release.

## Licensing

The combined Folia Cine Stage source and bundle are distributed under AGPL-3.0. The repository-wide blog/CMS license is unchanged. Mineradio-derived/adapted portions retain their GPL-3.0 source attribution under the GPLv3/AGPLv3 compatibility terms; see `THIRD-PARTY-NOTICES.md` and the adjacent `LICENSES/` directory.