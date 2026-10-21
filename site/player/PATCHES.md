# Local Folia source patches

Applied on top of upstream `26c57f9b1b26b402a09e8943171a332215418ce6` and built with:

```sh
VITE_NETEASE_API_BASE=/api/netease VITE_AI_PROVIDER=google vite build --base=/player/
```

1. `src/components/app/playback/bridges/useTransportCommandRefs.ts`
   - Exposes the existing transport handlers as `window.__FOLIA_NEXT__` and
     `window.__FOLIA_PREV__` for the site's persistent mobile transport controls.
2. `src/components/wall/useWallPointerPan.ts`
   - Adds an `axis: 'both' | 'x' | 'y'` option. The locked axis is zeroed for drag,
     wheel and inertia.
3. `src/library/suites/bravais/useBravaisCamera.ts`
   - Passes `axis: 'y'` below 768px, so the mobile infinite wall pans vertically only.
4. `src/library/suites/bravais/useBravaisSeam.ts`
   - Below 768px, plans the Bravais wall seam against the left edge (screen x = opening width / 2)
     and treats the viewport edge as having no margin, instead of leaving the world seam in the
     middle of a portrait screen. The home seam opens to the rail width. Re-plans when the viewport
     width changes.
   - The shipped `site/listen/index.html` keeps the matching left navigation rail width and hides
     the old right-edge mask.
5. `src/library/suites/bravais/bravaisConstants.ts`
   - Adds `getBravaisMobileRailWidth`. On portrait widths, `getBravaisScale` derives the camera
     scale from the content width right of the rail, so whole tile columns fit instead of the last
     column being cut by the viewport. The site also hides any remaining tile that would straddle
     the rail or the right edge.

The shipped bundle remains AGPL-3.0. The full upstream source is available at the
URL above; these are the local source changes.
