import React from 'react';
import { defineVisualizer } from '../definition';

const MineradioCine = React.lazy(() => import('./MineradioCine'));

export default defineVisualizer({
    mode: 'cine',
    order: 130,
    labelKey: 'ui.visualizerCine',
    labelFallback: 'Cine Stage',
    previewSeed: 'cine-stage',
    previewStartOffset: 0,
    glyph: (
        <>
            <path d="M3 16.5 8.5 11l3.2 3.2 5.8-7.7" />
            <path d="M14 6.5h3.8v3.8" />
            <circle cx="5" cy="6" r="1.2" />
            <circle cx="19" cy="18" r="1.2" />
        </>
    ),
    command: {
        title: 'Visualizer: Cine Stage',
        description: 'Lyrics, particles, and a cinematic playlist shelf',
        keywords: ['cine', 'cinema', 'mineradio', 'particles', '歌单架', '电影镜头'],
    },
    followsSongHandoff: true,
    render: props => <MineradioCine {...props} />,
});