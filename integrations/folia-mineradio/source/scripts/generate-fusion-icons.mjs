import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const foliaRoot = path.resolve(process.argv[2] || '.');
const packageRoot = path.join(foliaRoot, 'node_modules/lucide-react');
const dynamicIconsUrl = pathToFileURL(path.join(packageRoot, 'dynamicIconImports.mjs'));
const { default: dynamicIcons } = await import(dynamicIconsUrl.href);
const names = Object.keys(dynamicIcons);
const keyToIcon = {};
const icons = {};

for (let offset = 0; offset < names.length; offset += 24) {
    const batch = names.slice(offset, offset + 24);
    await Promise.all(batch.map(async (name) => {
        const module = await dynamicIcons[name]();
        const data = module.__iconData;
        if (!data || !Array.isArray(data.node)) return;
        const iconId = data.name || name;
        icons[iconId] = data;
        keyToIcon[name] = iconId;
    }));
}

const outputDirectory = path.join(foliaRoot, 'src/fusion');
await fs.mkdir(outputDirectory, { recursive: true });
const outputFile = path.join(outputDirectory, 'cineIconData.generated.json');
await fs.writeFile(outputFile, JSON.stringify({ keyToIcon, icons }), 'utf8');
console.log(`Generated ${Object.keys(keyToIcon).length} icon aliases from ${Object.keys(icons).length} SVGs`);