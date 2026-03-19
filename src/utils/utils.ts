import { StyleSpecification, LayerSpecification } from 'maplibre-gl';

export function queryLayerByGroup(
    styles: StyleSpecification,
    groupIds: string,
    groupKey: string = "vallaris:group",
): LayerSpecification[] {
    const groupMap = renderGroupsMap(styles, [groupIds], groupKey);
    return groupMap[groupIds] ?? [];
}


export function renderGroupsMap(
    styles: StyleSpecification,
    groupIds: string[],
    groupKey: string = "vallaris:group",
): Record<string, LayerSpecification[]> {
    const groupMap: Record<string, LayerSpecification[]> = {};

    if (!styles?.layers) return groupMap;

    for (const layer of styles.layers) {
        const metadata = layer.metadata as Record<string, any> | undefined;
        const groupValue = metadata?.[groupKey];
        if (typeof groupValue === "string" && groupIds.includes(groupValue)) {
            if (!groupMap[groupValue]) {
                groupMap[groupValue] = [];
            }
            groupMap[groupValue].push(layer);
        }
    }

    return groupMap;
}
