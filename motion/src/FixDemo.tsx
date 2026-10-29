import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

type Target = { x: number; y: number; w: number; h: number };
type Props = {
  before: string;
  after: string;
  target: Target;
  mode: 'folder' | 'toc' | 'view';
  caption: string;
};

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

const Arrow: React.FC<{ x: number; y: number; press: number; opacity: number }> = ({ x, y, press, opacity }) => (
  <svg
    width="38"
    height="46"
    viewBox="0 0 38 46"
    style={{
      position: 'absolute',
      left: x,
      top: y,
      opacity,
      transform: `translate(-3px,-3px) scale(${press})`,
      transformOrigin: '5px 5px',
      filter: 'drop-shadow(0 5px 8px rgba(0,0,0,.65))',
      zIndex: 40,
    }}
  >
    <path d="M5 3 L33 24 L21 27 L27 40 L20 44 L14 31 L5 40 Z" fill="#fff" stroke="#080b13" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
);

const marker = (frame: number, start: number, duration = 24) =>
  interpolate(frame, [start, start + duration], [0, 1], clamp);

export const FixDemo: React.FC<Props> = ({ before, after, target, mode, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 220, mass: 0.65 }, durationInFrames: 34 });
  const shotScale = interpolate(enter, [0, 1], [0.965, 1]);
  const focus = interpolate(frame, [24, 62], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const lift = spring({ frame: frame - 40, fps, config: { damping: 13, mass: 0.55 }, durationInFrames: 30 });
  const liftY = interpolate(lift, [0, 1], [0, -12]);
  const liftScale = interpolate(lift, [0, 1], [1, 1.028]);
  const click = interpolate(frame, [70, 76, 80, 87], [1, 1, 0.9, 1], clamp);
  const reveal = interpolate(frame, [94, 150], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const post = interpolate(frame, [156, 202], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const camera = 1 + focus * 0.24 - reveal * 0.24;
  const targetCx = target.x + target.w / 2;
  const targetCy = target.y + target.h / 2;
  const targetFade = 1 - interpolate(frame, [92, 118], [0, 1], clamp);
  const dim = interpolate(frame, [20, 54], [0, 0.64], { ...clamp, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }) * targetFade;
  const cursorX = mode === 'folder'
    ? interpolate(frame, [0, 62, 72, 104, 132], [575, 520, 448, 614, 614], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) })
    : mode === 'view'
    ? interpolate(frame, [0, 62, 72, 104, 132], [790, 1008, 1008, 1008, 1008], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) })
    : interpolate(frame, [0, 62, 72, 104, 132], [850, 1240, 1248, 1248, 1248], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  const cursorY = mode === 'folder'
    ? interpolate(frame, [0, 62, 72, 104, 132], [730, 450, 420, 382, 382], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) })
    : mode === 'view'
    ? interpolate(frame, [0, 62, 72, 104, 132], [730, 210, 210, 210, 210], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) })
    : interpolate(frame, [0, 62, 72, 104, 132], [740, 240, 240, 240, 240], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  const cursorOpacity = interpolate(frame, [0, 22, 190, 208], [0, 1, 1, 0], clamp);
  const pulse = marker(frame, 70, 26);
  const postPulse = marker(frame, mode === 'folder' ? 120 : 104, 24);
  const hole = targetFade;

  const clip = `inset(${target.y * (1 - reveal)}px ${(1440 - target.x - target.w) * (1 - reveal)}px ${(900 - target.y - target.h) * (1 - reveal)}px ${target.x * (1 - reveal)}px round ${14 * reveal}px)`;

  return (
    <AbsoluteFill style={{ background: '#070a11', overflow: 'hidden', fontFamily: 'Inter, "Noto Sans SC", sans-serif' }}>
      {/* the real page, with a camera move toward the target */}
      <AbsoluteFill style={{ transform: `scale(${camera})`, transformOrigin: `${targetCx}px ${targetCy}px` }}>
        <AbsoluteFill style={{ transform: `scale(${shotScale})`, animation: 'none' }}>
          <Img src={staticFile(before)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(.92) contrast(1.02)' }} />
        </AbsoluteFill>
      </AbsoluteFill>

      {/* the real after page, revealed from the target rectangle */}
      <AbsoluteFill style={{ clipPath: clip, opacity: reveal > 0 ? 1 : 0, transform: `scale(${camera})`, transformOrigin: `${targetCx}px ${targetCy}px` }}>
        <Img src={staticFile(after)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.02) contrast(1.01)' }} />
      </AbsoluteFill>

      {/* dim everything outside the target; the hole is the actual target rect */}
      <div
        style={{
          position: 'absolute', left: target.x, top: target.y, width: target.w, height: target.h,
          boxShadow: `0 0 0 9999px rgba(2,5,10,${dim})`,
          borderRadius: 14, opacity: hole, pointerEvents: 'none', zIndex: 2,
        }}
      />

      {/* exact crop of the target, lifted above the page */}
      <AbsoluteFill style={{ transform: `scale(${camera})`, transformOrigin: `${targetCx}px ${targetCy}px`, zIndex: 6, pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute', left: target.x, top: target.y, width: target.w, height: target.h,
            backgroundImage: `url(${staticFile(before)})`, backgroundSize: '1440px 900px',
            backgroundPosition: `-${target.x}px -${target.y}px`,
            transform: `translateY(${liftY}px) scale(${liftScale})`,
            transformOrigin: 'center', borderRadius: 14,
            boxShadow: `0 28px 58px rgba(0,0,0,${0.3 + focus * 0.18}), 0 0 0 1.5px rgba(124,231,227,${focus * 0.9})`,
            opacity: targetFade,
            filter: `brightness(${1 + focus * 0.035})`,
          }}
        />
        <div
          style={{
            position: 'absolute', left: target.x - 4, top: target.y - 4, width: target.w + 8, height: target.h + 8,
            border: `2px solid rgba(124,231,227,${focus * targetFade * 0.95})`, borderRadius: 17,
            boxShadow: `0 0 ${30 * focus * targetFade}px rgba(124,231,227,${0.45 * focus * targetFade})`,
            transform: `translateY(${liftY}px)`, opacity: targetFade,
          }}
        />
        <div style={{ position: 'absolute', left: targetCx, top: target.y - 36, transform: 'translateX(-50%)', opacity: focus * targetFade, color: '#dffcf9', font: '600 11px ui-monospace, monospace', letterSpacing: '.12em', whiteSpace: 'nowrap', textShadow: '0 2px 8px #000' }}>
          {mode === 'folder' ? '目标 · 文件夹' : mode === 'view' ? '目标 · 视图切换' : '目标 · 文章目录'}
        </div>
      </AbsoluteFill>

      {/* click ripples */}
      <div style={{ position: 'absolute', left: targetCx - 30, top: targetCy - 30, width: 60, height: 60, borderRadius: '50%', border: '2px solid rgba(255,158,210,.95)', opacity: (1 - pulse) * (frame > 68 ? 1 : 0), transform: `scale(${.5 + pulse * 1.55})`, zIndex: 20 }} />
      <div style={{ position: 'absolute', left: targetCx - 30, top: targetCy - 30, width: 60, height: 60, borderRadius: '50%', border: '2px solid rgba(255,158,210,.65)', opacity: mode === 'folder' ? (1 - postPulse) * (frame > 120 ? 1 : 0) : 0, transform: `scale(${.5 + postPulse * 1.4})`, zIndex: 20 }} />

      {/* after-state focus: a second, very subtle highlight */}
      <div style={{ position: 'absolute', left: target.x - 2, top: target.y - 2, width: target.w + 4, height: target.h + 4, border: `1px solid rgba(124,231,227,${post * .32})`, borderRadius: 15, opacity: reveal, zIndex: 5, pointerEvents: 'none' }} />

      <Arrow x={cursorX} y={cursorY} press={click} opacity={cursorOpacity} />

      {/* a lower-third label; the card frame/caption stays outside this video */}
      <div style={{ position: 'absolute', left: 40, bottom: 34, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, background: 'rgba(4,7,12,.78)', border: '1px solid rgba(255,255,255,.15)', color: '#e4e8f4', fontSize: 13, opacity: interpolate(frame, [0, 22, 190, 210], [0, 1, 1, 0], clamp), zIndex: 50, backdropFilter: 'blur(10px)' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7ce7e3', boxShadow: '0 0 12px #7ce7e3' }} />
        {caption}
      </div>
    </AbsoluteFill>
  );
};
