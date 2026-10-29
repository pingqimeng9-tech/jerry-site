---
name: ui-motion-demos
description: Use when creating or fixing UI motion demos, article demo cards, before/after animations, keyframes, swipe decks, cursor walkthroughs, or "动画演示" for a website. Enforces real-screen fidelity, choreographed keyframes, spatial continuity, and replayable interaction demos instead of lazy pulse/loop effects.
---

# UI Motion Demos

Use this skill for animation-heavy UI demos. The goal is not “add some keyframes”; the goal is a short, readable scene that explains **what changes, where it changes, and how the new interaction feels**.

## What “good K-frames” means here

A good sequence has:

1. **Establish** — the real screen enters, readable.
2. **Focus** — everything else dims; the target block lifts, scales slightly, and gets a precise outline/callout.
3. **Before** — the current interaction is demonstrated once, clearly.
4. **Change** — the modified element enters from the target's own position; no teleporting.
5. **After** — the new interaction is demonstrated once, on the same screen.
6. **Hold/Replay** — the final state rests long enough to read; the viewer can replay.

Do not use an infinite pulse ring as the main animation. A pulse can only be a focus aid, never the whole demo.

## Non-negotiables

- **Real screens only.** Use screenshots/recordings of the actual site at fixed viewports. Never substitute hand-drawn browser mocks for the site.
- **Real DOM coordinates.** Compute annotation positions from `getBoundingClientRect()` of the actual element, not by eye.
- **One action at a time.** One cursor path, one click, one state change per beat. If two things move, give them a clear hierarchy.
- **No teleporting.** The “after” element must originate from, or visibly connect to, the “before” target.
- **No default easing.** Use a deliberate curve per keyframe segment. `ease`, `ease-in-out`, and linear are red flags except for progress/scan loops.
- **Animate compositor-friendly properties.** Prefer `transform`, `opacity`, and `filter`. Avoid animating `top`, `left`, `width`, `height`, or `box-shadow` as the main motion. Use FLIP for layout changes.
- **Spatial continuity.** Keep the screen camera stable. If you zoom, zoom toward the target; do not jump the crop.
- **Short and legible.** Aim for 4–6 seconds per card, 300–700 ms per beat. No 10-second intro.
- **User controls it.** No auto-advancing to the next card. Provide replay, pause-on-hover where appropriate, and a reduced-motion fallback.
- **The demo must survive without narration.** If a viewer cannot tell what changed without reading the paragraph, the motion is not finished.

## Motion tokens

Use named tokens, not random values:

```css
:root {
  --motion-enter: cubic-bezier(.16, 1, .3, 1);      /* decelerate into place */
  --motion-exit: cubic-bezier(.4, 0, 1, 1);         /* accelerate away */
  --motion-spring: cubic-bezier(.22, 1.35, .36, 1); /* small overshoot, not cartoon */
  --motion-focus: cubic-bezier(.2, .8, .2, 1);
  --dur-fast: 180ms;
  --dur-beat: 420ms;
  --dur-scene: 600ms;
}
```

Rules:
- Enter: opacity + small translate + slight scale, decelerating.
- Exit: faster, accelerating, usually downward/away.
- Lift: `translateY(-4px) scale(1.015)`; not 20px and not 1.3×.
- Spotlight: dim the rest first, then outline the target; do not flash the whole screen.
- Cursor: ease-in-out path with a short click press; never a linear bounce across the card.

## Keyframe pattern

Do not put one easing on a multi-part move. Key each property at its actual beat:

```js
target.animate([
  { opacity: 0, transform: 'translateY(14px) scale(.992)', filter: 'blur(3px)', easing: 'var(--motion-enter)' },
  { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)', offset: .62 },
  { opacity: 1, transform: 'translateY(0) scale(1)', offset: 1 }
], { duration: 620, fill: 'both' });
```

For a **lift + focus**:

```js
target.animate([
  { transform: 'translateY(0) scale(1)', boxShadow: '0 8px 20px rgba(0,0,0,.18)', easing: 'var(--motion-spring)' },
  { transform: 'translateY(-5px) scale(1.018)', boxShadow: '0 22px 44px rgba(0,0,0,.32)', offset: .7 },
  { transform: 'translateY(-3px) scale(1.012)', boxShadow: '0 18px 36px rgba(0,0,0,.28)' }
], { duration: 520, fill: 'both' });
```

For a **before → after replacement**, do not crossfade two unrelated images. Use a shared anchor:

```js
// 1. Dim the old screen, lift the target.
// 2. Draw the target outline.
// 3. The after component enters from the same center/edge.
// 4. Old target fades/slides out only after the new one is visible.
// 5. New interaction demo starts after the scene settles.
```

## Card demo structure

Each demo card should be a framed scene, not a fake browser window:

```html
<article class="motion-card" data-motion-card>
  <div class="motion-frame">
    <img class="motion-screen" src="/demo/real-page.webp" alt="">
    <div class="motion-spotlight"></div>
    <div class="motion-target"></div>
    <div class="motion-after"></div>
    <div class="motion-cursor"></div>
    <div class="motion-caption"></div>
  </div>
  <div class="motion-controls">
    <button data-replay>重播</button>
    <span data-step>2 / 5</span>
  </div>
</article>
```

- Multiple cards live in a horizontal deck; one card visible at a time.
- The card frame is the outer border; do not add fake browser chrome on top of the screenshot.
- Screen images must be actual captures at the same aspect ratio as the frame.
- Annotation/data comes from a JSON timeline; do not hard-code eye-balled percentages.

## Recommended timeline schema

```json
{
  "screen": "/demo/blog-desktop.webp",
  "viewport": { "w": 1440, "h": 900 },
  "target": { "x": 0.12, "y": 0.26, "w": 0.22, "h": 0.08 },
  "beats": [
    { "at": 0, "kind": "enter", "duration": 520 },
    { "at": 520, "kind": "focus", "duration": 480 },
    { "at": 1000, "kind": "before", "duration": 900 },
    { "at": 1900, "kind": "change", "duration": 620 },
    { "at": 2520, "kind": "after", "duration": 900 },
    { "at": 3420, "kind": "settle", "duration": 600 }
  ]
}
```

Normalize coordinates so the same timeline works at different card widths. Store the screenshot and timeline together.

## Interaction demonstration

- Prefer a short real recording of the actual interaction when timing is hard to fake.
- If using an animated cursor, move it along a curved path, pause before the click, press down/up, then show the result.
- Demonstrate **one** interaction: click a filter, open the folder, scroll to the TOC. Do not show three actions at once.
- After the new interaction, hold the result for at least 600 ms.
- Do not loop the whole sequence automatically. Loop only idle ambient motion, if any.

## Performance and accessibility

- Use `requestAnimationFrame` or Web Animations API for orchestration.
- Cancel animations on replay/unmount; do not stack listeners.
- Avoid animating `filter: blur()` on large full-screen layers continuously.
- Add `prefers-reduced-motion`: show the first and last frames plus a static annotation, and keep the replay control.
- Keep 60 fps at 390 px and 1440 px. If it cannot, simplify the scene.
- No layout shift when the after element enters.

## QA checklist

- Does the target block visibly lift before the change? Is the outline aligned?
- Does the after element enter from the target, not from nowhere?
- Can a viewer understand the before vs after without reading the paragraph?
- Is the cursor path plausible? Does the click have a pressed state?
- Does the demo end and hold? Can it replay?
- Does it still work with reduced motion?
- Is the screenshot 1:1 with the real page at the stated viewport?
- Are all cards framed consistently, with one card visible at a time?
- Is there no horizontal page overflow, clipped card, or console error?

## Anti-patterns

- Infinite pulsing ring as the main effect.
- Every element moving at once.
- Layers flying in from off-screen with no relation to the target.
- Fake browser chrome around a hand-drawn mock.
- Auto-advancing carousel that steals control.
- Linear 1-second fades and identical easing on every beat.
- Fake cursor that teleports or clicks before arriving.
- Animating box-shadow/height/width as the primary motion.
- A demo that looks good in isolation but does not match the live page.

## Site-specific integration

For callmiruko.cc article cards:

- Capture desktop `1440×900` and mobile `390×844` at DPR 2.
- Store under `site/images/demos/<slug>/` as WebP; store timeline JSON beside it.
- One visible card in a horizontal deck; swipe/drag/arrows/dots/replay.
- The card frame is the only frame. No invented window controls.
- Initialize after `marked.parse`; cancel all animations when the article unmounts.
- For template-library previews, remember `ctx.demo` only fires in auto contexts; standalone previews need an explicit fallback.
