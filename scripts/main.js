import { dataLoader } from '/modules/lookfar/scripts/dataLoader.js';

const MODULE_ID = 'lookfar-extension';
const JSON_PATH = `modules/${MODULE_ID}/data/custom-qualities.json`;

/**
 * Carga el archivo JSON de cualidades personalizadas.
 */
async function loadCustomQualities() {
    try {
        const response = await fetch(JSON_PATH);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (err) {
        console.error(`${MODULE_ID}: Error al cargar ${JSON_PATH}`, err);
        return null;
    }
}

/**
 * Fusiona las cualidades personalizadas con las de Lookfar.
 */
function mergeQualities(customData) {
    if (!customData) return;

    const { qualities, translations } = customData;

    // 1. Fusionar las definiciones de cualidades
    // Lookfar espera un objeto con categorías: { basic: [...], aerial: [...] }
    // Buscamos dónde guarda Lookfar sus datos. Según itemForge.js, lee de dataLoader.
    // Los arrays de cualidades por tipo de objeto están en:
    // dataLoader.weaponsData.weaponQualities, armorData.armorQualities, etc.
    // Pero esas listas ya están procesadas. Para inyectar cualidades nuevas,
    // necesitamos añadir directamente a esos arrays.

    // Primero, veamos si dataLoader expone las listas por tipo de objeto:
    const targets = [
        { key: 'weaponQualities', path: ['weaponsData', 'weaponQualities'] },
        { key: 'armorQualities', path: ['armorData', 'armorQualities'] },
        { key: 'shieldQualities', path: ['shieldsData', 'shieldQualities'] },
        { key: 'accessoryQualities', path: ['accessoriesData', 'accessoryQualities'] }
    ];

    // Recorremos las categorías personalizadas y sus cualidades
    for (const [category, entries] of Object.entries(qualities)) {
        for (const entry of entries) {
            // Determinamos a qué listas por tipo de objeto pertenece según appliesTo
            for (const { key, path } of targets) {
                // Navegamos hasta el contenedor (ej. dataLoader.weaponsData)
                const container = path.slice(0, -1).reduce((obj, k) => obj?.[k], dataLoader);
                const arrayKey = path[path.length - 1];

                if (!container || !Array.isArray(container[arrayKey])) {
                    console.warn(`${MODULE_ID}: No se encontró ${path.join('.')}`);
                    continue;
                }

                // Si la cualidad aplica a este tipo de objeto, la añadimos
                // (asumiendo que appliesTo contiene strings como "weapon", "armor", etc.)
                const appliesToThis = entry.appliesTo.some(t => {
                    // Mapeo simple: "weapon" -> weaponQualities, "armor" -> armorQualities, etc.
                    const typeMap = { weapon: 'weaponQualities', armor: 'armorQualities', shield: 'shieldQualities', accessory: 'accessoryQualities' };
                    return typeMap[t] === key;
                });

                if (!appliesToThis) continue;

                // Evitar duplicados: si ya existe un id igual, lo reemplazamos
                const existingIndex = container[arrayKey].findIndex(q => q.id === entry.id);
                if (existingIndex >= 0) {
                    container[arrayKey][existingIndex] = { ...entry };
                } else {
                    container[arrayKey].push({ ...entry });
                }
            }
        }
    }

    // 2. Fusionar las traducciones
    // Las traducciones se usan a través de game.i18n. Podemos fusionarlas allí.
    if (translations) {
        const currentTranslations = game.i18n.translations;
        for (const [id, trans] of Object.entries(translations)) {
            // Lookfar busca las traducciones bajo la clave "qualities" en el bundle de i18n.
            // Añadimos/sobrescribimos en el objeto de traducciones global.
            if (!currentTranslations.qualities) currentTranslations.qualities = {};
            // Buscamos la categoría a la que pertenece esta cualidad (según qualities)
            // para colocarla en el lugar correcto. Como no sabemos la categoría exacta,
            // podemos ponerla en una categoría genérica "custom" o buscar en todas.
            // Simplificación: la añadimos directamente en el nivel superior de "qualities".
            // Pero Lookfar espera que esté bajo una categoría. 
            // Para simplificar, la añadimos bajo la primera categoría que encontremos o creamos una "custom".
            if (!currentTranslations.qualities.custom) currentTranslations.qualities.custom = {};
            currentTranslations.qualities.custom[id] = trans;
        }
        console.log(`${MODULE_ID}: Traducciones personalizadas añadidas.`);
    }

    console.log(`${MODULE_ID}: Cualidades personalizadas fusionadas correctamente.`);
}

Hooks.once('ready', async () => {
    const lookfar = game.modules.get('lookfar');
    if (!lookfar?.active) {
        console.warn(`${MODULE_ID}: Lookfar no está activo.`);
        return;
    }

    // Esperamos a que dataLoader tenga datos
    if (!dataLoader?.weaponsData) {
        await new Promise(r => setTimeout(r, 1000));
    }

    const custom = await loadCustomQualities();
    mergeQualities(custom);

    ui.notifications.info('Lookfar Extension: cualidades personalizadas cargadas.');
});