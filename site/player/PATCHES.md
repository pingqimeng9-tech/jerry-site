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
   - Keeps the `axis` option; mobile now pans the infinite wall in both directions, like desktop.
4. `src/library/suites/bravais/useBravaisSeam.ts`
   - Below 768px, the home seam closes to zero width and moves off the visible wall, so the
     infinite canvas has no central gap. The navigation DOM is kept visible at the left edge.
   - The shipped `site/listen/index.html` draws an opaque fixed rail over the canvas and keeps the
     original seam controls in it.
5. `src/library/suites/bravais/bravaisConstants.ts`
   - Adds `getBravaisMobileRailWidth`, matching the site's opaque left rail width. Folia's original
     infinite-canvas zoom is unchanged on mobile.
6. `src/components/visualizer/classic/Visualizer.tsx` and `glowWordVariants.ts`
   - Adds a portrait-only layout for the default classic lyric style: words flow/wrap inside the
     viewport instead of using the landscape random offsets, with a reduced active scale and no
     waiting/passed x/y drift. Landscape and desktop behavior is unchanged.

The shipped bundle remains AGPL-3.0. The full upstream source is available at the
URL above; these are the local source changes.
