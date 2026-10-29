import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

type Target = { x: number; y: number; w: number; h: number };
type Props = {
  before: string;
  after: string;
  target: Target;
  mode: 'folder' | 'toc';
  caption: string;
};

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

const Arrow: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg
    width="34"
    height="42"
    viewBox="0 0 34 42"
    style={{ position: 'absolute', left: x, top: y, transform: `scale(${press})`, transformOrigin: '4px 4px', filter: 'drop-shadow(0 4px 7px rgba(0,0,0,.6))', zIndex: 30 }}
  >
    <path d="M4 3 L29 21 L18 24 L24 36 L18 39 L12 27 L4 35 Z" fill="#fff" stroke="#0b0d18" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const ring = (frame: number, start: number, duration = 22) =>
  interpolate(frame, [start, start + duration], [0, 1], clamp);

export const FixDemo: React.FC<Props> = ({ before, after, target, mode, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 200, mass: 0.7 }, durationInFrames: 32 });
  const shotScale = interpolate(enter, [0, 1], [0.975, 1]);
  const focus = interpolate(frame, [22, 48], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const lift = spring({ frame: frame - 34, fps, config: { damping: 14, mass: 0.55 }, durationInFrames: 28 });
  const liftY = interpolate(lift, [0, 1], [0, -9]);
  const liftScale = interpolate(lift, [0, 1], [1, 1.018]);
  const click = interpolate(frame, [62, 68, 72, 78], [1, 1, 0.92, 1], clamp);
  const afterIn = interpolate(frame, [82, 116], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const afterScale = interpolate(frame, [82, 116], [1.018, 1]);
  const cursorX = mode === 'folder'
    ? interpolate(frame, [0, 54, 64, 90, 104], [560, 520, 438, 610, 610], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) })
    : interpolate(frame, [0, 54, 64, 90, 104], [830, 1238, 1250, 1250, 1250], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  const cursorY = mode === 'folder'
    ? interpolate(frame, [0, 54, 64, 90, 104], [720, 448, 420, 360, 360], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) })
    : interpolate(frame, [0, 54, 64, 90, 104], [700, 204, 204, 204, 204], { ...clamp, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  const cursorVisible = interpolate(frame, [0, 18, 150, 166], [0, 1, 1, 0], clamp);
  const pulse = ring(frame, 58, 24);
  const postClick = ring(frame, mode === 'folder' ? 100 : 86, 24);
  const dimFull = interpolate(frame, [20, 46], [0, 0.62], { ...clamp, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
  const dim = dimFull * (1 - interpolate(frame, [82, 102], [0, 1], clamp));
  const targetFade = 1 - interpolate(frame, [82, 102], [0, 1], clamp);

  const top = target.y;
  const left = target.x;
  const right = 1440 - (target.x + target.w);
  const bottom = 900 - (target.y + target.h);

  return (
    <AbsoluteFill style={{ background: '#070910', overflow: 'hidden', fontFamily: 'Inter, "Noto Sans SC", sans-serif' }}>
      <AbsoluteFill style={{ transform: `scale(${shotScale})`, opacity: enter, transformOrigin: '50% 45%' }}>
        <Img src={staticFile(before)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>

      <AbsoluteFill style={{ opacity: afterIn }}>
        <Img src={staticFile(after)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${afterScale})`, transformOrigin: `${target.x + target.w / 2}px ${target.y + target.h / 2}px` }} />
      </AbsoluteFill>

      {/* dim everything except the target */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: top, background: `rgba(0,0,0,${dim})`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: top + target.h, bottom: 0, background: `rgba(0,0,0,${dim})`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, top, width: left, height: target.h, background: `rgba(0,0,0,${dim})`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: left + target.w, top, right: 0, height: target.h, background: `rgba(0,0,0,${dim})`, pointerEvents: 'none' }} />

      {/* lifted, exact crop of the target */}
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: target.w,
          height: target.h,
          backgroundImage: `url(${staticFile(before)})`,
          backgroundSize: '1440px 900px',
          backgroundPosition: `-${left}px -${top}px`,
          transform: `translateY(${liftY}px) scale(${liftScale})`,
          transformOrigin: 'center center',
          borderRadius: 14,
          boxShadow: `0 26px 60px rgba(0,0,0,${0.3 + focus * 0.18}), 0 0 0 2px rgba(124,231,227,${focus})`,
          opacity: targetFade,
          zIndex: 4,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: left - 3,
          top: top - 3,
          width: target.w + 6,
          height: target.h + 6,
          border: `2px solid rgba(124,231,227,${focus * targetFade})`,
          borderRadius: 16,
          boxShadow: `0 0 ${24 * focus * targetFade}px rgba(124,231,227,${0.4 * focus * targetFade})`,
          transform: `translateY(${liftY}px)`,
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'absolute', left: left + target.w / 2, top: top - 34, transform: 'translateX(-50%)', color: '#dffcf9', font: '600 12px ui-monospace, monospace', letterSpacing: '.1em', opacity: focus * targetFade, zIndex: 6 }}>
        {mode === 'folder' ? '点击展开' : '点击跳转'}
      </div>

      {/* click ring */}
      <div style={{ position: 'absolute', left: left + target.w / 2 - 28, top: top + target.h / 2 - 28, width: 56, height: 56, borderRadius: '50%', border: '2px solid rgba(255,158,210,.95)', opacity: (1 - pulse) * (frame > 58 ? 1 : 0), transform: `scale(${0.55 + pulse * 1.45})`, zIndex: 20, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: left + target.w / 2 - 28, top: top + target.h / 2 - 28, width: 56, height: 56, borderRadius: '50%', border: '2px solid rgba(255,158,210,.65)', opacity: mode === 'folder' ? (1 - postClick) * (frame > 100 ? 1 : 0) : 0, transform: `scale(${0.55 + postClick * 1.3})`, zIndex: 20, pointerEvents: 'none' }} />

      <div style={{ opacity: cursorVisible, zIndex: 25 }}>
        <Arrow x={cursorX} y={cursorY} press={click} />
      </div>

      <div style={{ position: 'absolute', left: 44, bottom: 38, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 10, background: 'rgba(5,8,14,.7)', border: '1px solid rgba(255,255,255,.14)', color: '#dfe3f2', fontSize: 13, opacity: interpolate(frame, [0, 20, 160, 176], [0, 1, 1, 0], clamp), zIndex: 40 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7ce7e3', boxShadow: '0 0 10px #7ce7e3' }} />
        {caption}
      </div>
    </AbsoluteFill>
  );
};
