# Keyframe Recipes

## Scene entrance

```css
@keyframes sceneIn {
  0%   { opacity: 0; transform: translateY(18px) scale(.985); filter: blur(6px); }
  55%  { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
```

Easing: `cubic-bezier(.16, 1, .3, 1)`, 520–620 ms.

## Focus / lift

```css
@keyframes focusLift {
  0%   { transform: translateY(0) scale(1); }
  65%  { transform: translateY(-5px) scale(1.018); }
  100% { transform: translateY(-3px) scale(1.012); }
}
```

Easing: `cubic-bezier(.22, 1.35, .36, 1)`, 420–520 ms. Pair with a non-looping outline draw.

## Target outline

```css
@keyframes drawOutline {
  from { stroke-dashoffset: 100%; }
  to   { stroke-dashoffset: 0; }
}
```

Use an SVG rect sized to the real target. Do not use a thick static border.

## After element enters

```css
@keyframes afterIn {
  0%   { opacity: 0; transform: translateY(10px) scale(.94); filter: blur(4px); }
  60%  { opacity: 1; transform: translateY(-1px) scale(1.005); filter: blur(0); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
```

Easing: `cubic-bezier(.16, 1, .3, 1)`, 500–620 ms. Origin should be the target's center.

## Spotlight dim

```css
@keyframes spotIn {
  from { opacity: 0; }
  to   { opacity: .68; }
}
```

Dim the page once, then draw the target outline. Do not pulse the dim layer.

## Cursor path

Use a small translated wrapper with a curved path, then a click state:

```css
@keyframes cursorMove {
  0%   { transform: translate(0, 0); }
  55%  { transform: translate(42px, -14px); }
  100% { transform: translate(76px, 4px); }
}
```

Pause 80–120 ms before click; add `scale(.92)` for 90 ms on press.

## Do not use

```css
/* lazy */
animation: pulse 1s infinite;

/* teleporting */
transform: translateX(500px);

/* everything at once */
* { animation: all 1s; }
```
