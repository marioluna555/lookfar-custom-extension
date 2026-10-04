import { MODULE_ID, DEFAULT_CATEGORIES } from './constants.js';

export function getCustomCategories() {
    return game.settings.get(MODULE_ID, 'customCategories') ?? [];
}

export async function getNativeCategories() {
    try {
        const mod = await import('/modules/lookfar/scripts/dataLoader.js');
        const data = mod.dataLoader;
        if (data?.weaponsData?.weaponQualities) {
            return Object.keys(data.weaponsData.weaponQualities);
        }
    } catch (_) { /* fallback */ }
    return [...DEFAULT_CATEGORIES];
}

export async function getAllCategories() {
    const [native, custom] = await Promise.all([
        getNativeCategories(),
        Promise.resolve(getCustomCategories())
    ]);
    return [...new Set([...native, ...custom, 'custom'])];
}

export async function addCategory(name) {
    const clean = String(name).trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-|-$/g, '');

    if (!clean) throw new Error('Nombre de categoría inválido.');

    const current = getCustomCategories();
    const native = await getNativeCategories();
    if (current.includes(clean) || native.includes(clean)) {
        throw new Error(`La categoría "${clean}" ya existe.`);
    }

    await game.settings.set(MODULE_ID, 'customCategories', [...current, clean]);
    return clean;
}

export async function removeCategory(name) {
    const current = getCustomCategories();
    if (!current.includes(name)) return 0;

    // Reasignar cualidades a 'custom' antes de eliminar
    const qualitiesData = game.settings.get(MODULE_ID, 'customQualities');
    const qualities = qualitiesData.qualities ?? [];
    let reassigned = 0;

    for (const q of qualities) {
        if (q.category === name) {
            q.category = 'custom';
            reassigned++;
        }
    }

    if (reassigned > 0) {
        await game.settings.set(MODULE_ID, 'customQualities', { qualities });
    }

    await game.settings.set(
        MODULE_ID,
        'customCategories',
        current.filter(c => c !== name)
    );

    return reassigned;
}