import { MODULE_ID } from './constants.js';

export function getQualities() {
    const data = game.settings.get(MODULE_ID, 'customQualities');
    return data.qualities ?? [];
}

export async function saveQuality(quality, originalId = null) {
    const data = game.settings.get(MODULE_ID, 'customQualities');
    const list = [...(data.qualities ?? [])];

    if (originalId) {
        const idx = list.findIndex(q => q.id === originalId);
        if (idx >= 0) list[idx] = quality;
        else list.push(quality);
    } else {
        if (list.some(q => q.id === quality.id)) {
            throw new Error(`Ya existe una cualidad con el id "${quality.id}".`);
        }
        list.push(quality);
    }

    await game.settings.set(MODULE_ID, 'customQualities', { qualities: list });
}

export async function deleteQuality(id) {
    const data = game.settings.get(MODULE_ID, 'customQualities');
    const list = (data.qualities ?? []).filter(q => q.id !== id);
    await game.settings.set(MODULE_ID, 'customQualities', { qualities: list });
}

export function findQuality(id) {
    return getQualities().find(q => q.id === id);
}