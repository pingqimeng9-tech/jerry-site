import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const integrationSource = path.resolve(scriptDirectory, '..');
const foliaRoot = path.resolve(process.argv[2] || '.');
const packageJson = JSON.parse(await fs.readFile(path.join(foliaRoot, 'package.json'), 'utf8'));

if (packageJson.version !== '0.7.21') {
    throw new Error(`Expected Folia 0.7.21, received ${packageJson.version || 'unknown'}`);
}

const replacements = new Map([
    ['src/types/visualizerModes.ts', [[
        "    'classic',\n    'diorama',",
        "    'classic',\n    'cine',\n    'diorama',",
    ]]],
    ['src/components/visualizer/definition.ts', [[
        "    type VisualizerMode,\n} from '../../types';",
        "    type VisualizerMode,\n} from '../../types';\nimport type { ProviderCollection } from '../../types/onlineMusic';",
    ], [
        "    coverUrl?: string | null;\n    /**\n     * Tempera canvas images",
        "    coverUrl?: string | null;\n    playlists?: ProviderCollection[];\n    onOpenPlaylist?: (playlist: ProviderCollection) => void;\n    /**\n     * Tempera canvas images",
    ]]],
    ['src/components/visualizer/useVisualizerRendererModel.ts', [[
        "import { PlayerState, type Theme, type VisualizerMode } from '../../types';",
        "import { PlayerState, type Theme, type VisualizerMode } from '../../types';\nimport type { ProviderCollection } from '../../types/onlineMusic';",
    ], [
        "    onLyricLineSeek: (index: number) => void;\n    onBack: () => void;",
        "    onLyricLineSeek: (index: number) => void;\n    onOpenPlaylist?: (playlist: ProviderCollection) => void;\n    onBack: () => void;",
    ], [
        "    onLyricLineSeek,\n    onBack,",
        "    onLyricLineSeek,\n    onOpenPlaylist,\n    onBack,",
    ], [
        "import { useVisualizerSettingsStore } from '../../stores/useVisualizerSettingsStore';",
        "import { useVisualizerSettingsStore } from '../../stores/useVisualizerSettingsStore';\nimport { useOnlineProviderAccountStore } from '../../stores/useOnlineProviderAccountStore';",
    ], [
        "type VisualizerRendererModelDeps = {",
        "const EMPTY_PROVIDER_COLLECTIONS: ProviderCollection[] = [];\n\ntype VisualizerRendererModelDeps = {",
    ], [
        "    const visualizerMode = useVisualizerSettingsStore(state => state.visualizerMode);",
        "    const visualizerMode = useVisualizerSettingsStore(state => state.visualizerMode);\n    const isCineRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/listen/fusion');\n    const effectiveVisualizerMode = isCineRoute ? 'cine' : visualizerMode;",
    ], [
        "    const displaySong = usePlaybackStore(selectDisplaySong);",
        "    const displaySong = usePlaybackStore(selectDisplaySong);\n    const playlists = useOnlineProviderAccountStore(state => state.accounts[state.activeProviderId]?.collections ?? EMPTY_PROVIDER_COLLECTIONS);",
    ], [
        "getVisualizerRegistryEntry(visualizerMode).followsSongHandoff",
        "getVisualizerRegistryEntry(effectiveVisualizerMode).followsSongHandoff",
    ], [
        "    const mode: VisualizerMode = resolveMainWindowVisualizerMode(visualizerMode, isObsBrowserSourceRendering, obsKeepMainWindowAnimation);",
        "    const mode: VisualizerMode = isCineRoute\n        ? 'cine'\n        : resolveMainWindowVisualizerMode(visualizerMode, isObsBrowserSourceRendering, obsKeepMainWindowAnimation);",
    ], [
        "        coverUrl: displayCoverUrl,",
        "        coverUrl: displayCoverUrl,\n        playlists,\n        onOpenPlaylist,",
    ], [
        "getVisualizerRegistryEntry(visualizerMode).seeksOnLineClick",
        "getVisualizerRegistryEntry(effectiveVisualizerMode).seeksOnLineClick",
    ]]],
    ['src/App.tsx', [[
        "        onLyricLineSeek: handleMonetLyricLineSeek,\n        onBack: navigateBackFromPlayer,",
        "        onLyricLineSeek: handleMonetLyricLineSeek,\n        onOpenPlaylist: collection => openHomeCollection(createOnlineGridViewCollection(collection, activeProviderId)),\n        onBack: navigateBackFromPlayer,",
    ]]],
    ['vite.config.ts', [[
        "        '@': path.resolve(__dirname, './src'),",
        "        '@': path.resolve(__dirname, './src'),\n        ...(process.env.FOLIA_CINE_BUILD === '1' ? {\n          'lucide-react/dynamicIconImports': path.resolve(__dirname, './src/fusion/dynamicIconImports.ts'),\n        } : {}),",
    ]]],
]);

const pendingWrites = [];
for (const [relativePath, edits] of replacements) {
    const filePath = path.join(foliaRoot, relativePath);
    let text = await fs.readFile(filePath, 'utf8');
    for (const [before, after] of edits) {
        const occurrences = text.split(before).length - 1;
        if (occurrences !== 1) {
            throw new Error(`${relativePath}: expected one patch anchor, found ${occurrences}: ${before.slice(0, 90)}`);
        }
        text = text.replace(before, after);
    }
    pendingWrites.push([filePath, text]);
}

const rendererSource = path.join(integrationSource, 'src/components/visualizer/mineradioCine');
const rendererTarget = path.join(foliaRoot, 'src/components/visualizer/mineradioCine');
for (const file of await fs.readdir(rendererSource)) {
    const sourcePath = path.join(rendererSource, file);
    const targetPath = path.join(rendererTarget, file);
    let contents;
    try {
        contents = await fs.readFile(targetPath);
        const expected = await fs.readFile(sourcePath);
        if (!contents.equals(expected)) throw new Error(`Refusing to overwrite ${targetPath}`);
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        contents = await fs.readFile(sourcePath);
        pendingWrites.push([targetPath, contents]);
    }
}

const iconAdapterSource = path.join(integrationSource, 'src/fusion/dynamicIconImports.ts');
const iconAdapterTarget = path.join(foliaRoot, 'src/fusion/dynamicIconImports.ts');
try {
    const current = await fs.readFile(iconAdapterTarget);
    const expected = await fs.readFile(iconAdapterSource);
    if (!current.equals(expected)) throw new Error(`Refusing to overwrite ${iconAdapterTarget}`);
} catch (error) {
    if (error.code !== 'ENOENT') throw error;
    pendingWrites.push([iconAdapterTarget, await fs.readFile(iconAdapterSource)]);
}

for (const [filePath, contents] of pendingWrites) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, contents);
}

console.log(`Applied Folia Cine overlay to ${foliaRoot} (${pendingWrites.length} files written)`);