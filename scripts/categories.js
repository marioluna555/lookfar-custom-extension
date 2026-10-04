import { MODULE_ID, DEFAULT_CATEGORIES } from './constants.js';

/** Devuelve las categorías custom guardadas por el GM. */
export function getCustomCategories() {
    return game.settings.get(MODULE_ID, 'customCategories') ?? [];
}

/** Devuelve las categorías nativas leídas desde Lookfar. */
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
    await game.settings.set(
        MODULE_ID,
        'customCategories',
        current.filter(c => c !== name)
    );
}