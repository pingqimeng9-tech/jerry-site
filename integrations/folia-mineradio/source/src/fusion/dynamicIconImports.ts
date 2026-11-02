import { createElement, forwardRef } from 'react';
import iconIndex from './cineIconData.generated.json';

type IconNode = [string, Record<string, string>, IconNode[]?];
type IconData = { name?: string; node: IconNode[]; aliases?: string[] };
type IconIndex = { keyToIcon: Record<string, string>; icons: Record<string, IconData> };
type IconProps = React.SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number };

const index = iconIndex as IconIndex;
const elementForNode = ([tag, attrs, children = []]: IconNode, key: number) => (
    createElement(tag, { ...attrs, key }, children.map(elementForNode))
);

const componentCache = new Map<string, React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>>();
const componentFor = (data: IconData) => {
    const iconId = data.name || '';
    const existing = componentCache.get(iconId);
    if (existing) return existing;
    const component = forwardRef<SVGSVGElement, IconProps>(({ size = 24, strokeWidth = 2, color = 'currentColor', ...props }, ref) => (
        createElement('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: size,
            height: size,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: color,
            strokeWidth,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            ...props,
            ref,
        }, data.node.map(elementForNode))
    ));
    component.displayName = iconId || 'FoliaIcon';
    componentCache.set(iconId, component);
    return component;
};

const dynamicIconImports = Object.fromEntries(
    Object.entries(index.keyToIcon).flatMap(([key, iconId]) => {
        const data = index.icons[iconId];
        return data ? [[key, () => Promise.resolve({ default: componentFor(data), __iconData: data })]] : [];
    }),
);

export default dynamicIconImports;