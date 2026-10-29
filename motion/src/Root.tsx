import { Composition } from 'remotion';
import { FixDemo } from './FixDemo';

export const RemotionRoot = () => (
  <>
    <Composition
      id="FolderDemo"
      component={FixDemo}
      durationInFrames={210}
      fps={30}
      width={1440}
      height={900}
      defaultProps={{
        before: 'screens/folder-closed.png',
        after: 'screens/folder-open.png',
        target: { x: 300, y: 267, w: 263, h: 278 },
        mode: 'folder' as const,
        caption: '点击文件夹，章节卡从里面出来',
      }}
    />
    <Composition
      id="ViewDemo"
      component={FixDemo}
      durationInFrames={210}
      fps={30}
      width={1440}
      height={900}
      defaultProps={{
        before: 'screens/blog-desktop.png',
        after: 'screens/folder-closed.png',
        target: { x: 817, y: 187, w: 128, h: 38 },
        mode: 'view' as const,
        caption: '点击「文件夹」，视图切换成卡片堆',
      }}
    />
    <Composition
      id="TocDemo"
      component={FixDemo}
      durationInFrames={210}
      fps={30}
      width={1440}
      height={900}
      defaultProps={{
        before: 'screens/article-desktop.png',
        after: 'screens/article-toc-active.png',
        target: { x: 1154, y: 123, w: 230, h: 315 },
        mode: 'toc' as const,
        caption: '点击目录，页面滚到对应章节',
      }}
    />
  </>
);
