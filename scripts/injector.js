import { MODULE_ID, TYPE_MAP } from './constants.js';
import { getQualities } from './qualities.js';

let dataLoaderCache = null;
let nativeCache = null;

async function getDataLoader() {
    if (dataLoaderCache) return dataLoaderCache;
    try {
        const mod = await import('/modules/lookfar/scripts/dataLoader.js');
        dataLoaderCache = mod.dataLoader;
        return dataLoaderCache;
    } catch (err) {
        console.error(`${MODULE_ID}: No se pudo importar dataLoader.`, err);
        return null;
    }
}

/**
 * Guarda una copia profunda de los datos nativos de Lookfar.
 * Se ejecuta una sola vez, antes de cualquier inyección.
 */
function cacheNativeData(dataLoader) {
    if (nativeCache) return;
    nativeCache = {};
    for (const [typeKey, info] of Object.entries(TYPE_MAP)) {
        const container = dataLoader?.[info.containerKey];
        if (!container) continue;
        const qualities = container[info.arrayKey];
        if (qualities) {
            nativeCache[typeKey] = JSON.parse(JSON.stringify(qualities));
        }
    }
}

export async function injectQualities() {
    const dataLoader = await getDataLoader();
    if (!dataLoader) return;

    // 1) Guardar copia original de los datos nativos (solo la primera vez)
    cacheNativeData(dataLoader);

    // 2) Restaurar los datos nativos originales antes de cualquier modificación
    for (const [typeKey, info] of Object.entries(TYPE_MAP)) {
        const container = dataLoader?.[info.containerKey];
        if (!container) continue;
        const native = nativeCache[typeKey];
        if (native) {
            container[info.arrayKey] = JSON.parse(JSON.stringify(native));
        }
    }

    const hideNative = game.settings.get(MODULE_ID, 'hideNativeQualities');
    const qualities = getQualities();

    // 3) Si el checkbox está activo, eliminar todas las cualidades nativas
    if (hideNative) {
        for (const info of Object.values(TYPE_MAP)) {
            const catObj = dataLoader?.[info.containerKey]?.[info.arrayKey];
            if (!catObj || typeof catObj !== 'object') continue;
            for (const cat of Object.keys(catObj)) {
                if (Array.isArray(catObj[cat])) {
                    // Conservar solo las que llevan nuestra marca
                    catObj[cat] = catObj[cat].filter(q => q._lookfarExtension);
                }
            }
        }
    }

    // 4) Inyectar las cualidades personalizadas
    for (const q of qualities) {
        if (!q.id || !Array.isArray(q.appliesTo) || !q.appliesTo.length) continue;
        const category = q.category || 'custom';

        // Traducciones
        game.i18n.translations.qualities ??= {};
        game.i18n.translations.qualities[category] ??= {};
        const trans = { Description: q.description ?? '' };
        for (const type of q.appliesTo) {
            const cap = TYPE_MAP[type]?.capitalized;
            if (cap) trans[cap] = q.name;
        }
        game.i18n.translations.qualities[category][q.id] = trans;

        // Datos
        for (const type of q.appliesTo) {
            const info = TYPE_MAP[type];
            if (!info) continue;
            const container = dataLoader?.[info.containerKey];
            if (!container) continue;
            container[info.arrayKey] ??= {};
            container[info.arrayKey][category] ??= [];
            const exists = container[info.arrayKey][category].some(e => e.id === q.id);
            if (!exists) {
                container[info.arrayKey][category].push({
                    id: q.id,
                    name: q.name,
                    value: Number(q.cost) || 0,
                    description: q.description ?? '',
                    _lookfarExtension: true
                });
            }
        }
    }

    console.log(`${MODULE_ID}: ${qualities.length} cualidades inyectadas. (hideNative: ${hideNative})`);
}