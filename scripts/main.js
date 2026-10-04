// scripts/main.js
import { QualitiesEditor } from './qualities-editor.js';
import { MODULE_ID } from './constants.js';

// Helper de Handlebars para los checkboxes y el "not"
Handlebars.registerHelper('not', v => !v);
Handlebars.registerHelper('lfIncludes', (array, value) => Array.isArray(array) && array.includes(value));

// Cache del dataLoader (se carga bajo demanda)
let dataLoaderCache = null;

/**
 * Importa el dataLoader de Lookfar de forma perezosa y segura.
 * Si el import falla, devuelve null y no rompe el resto del módulo.
 */
async function getDataLoader() {
    if (dataLoaderCache) return dataLoaderCache;
    try {
        const mod = await import('/modules/lookfar/scripts/dataLoader.js');
        dataLoaderCache = mod.dataLoader;
        return dataLoaderCache;
    } catch (err) {
        console.error(`${MODULE_ID}: No se pudo importar dataLoader de Lookfar.`, err);
        return null;
    }
}

Hooks.once('init', () => {
    // Almacén persistente de cualidades personalizadas (por mundo)
    game.settings.register(MODULE_ID, 'customQualities', {
        scope: 'world',
        config: false,
        type: Object,
        default: { qualities: [] },
        onChange: () => {
            injectQualities();
            ui.notifications.info('Lookfar Extension: cualidades actualizadas. Cierra y reabre la Forja de Objetos.');
        }
    });

    // Botón en la configuración del mundo
    game.settings.registerMenu(MODULE_ID, 'qualitiesEditor', {
        name: 'LOOKFAR_EXT.Editor.MenuName',
        label: 'LOOKFAR_EXT.Editor.MenuLabel',
        hint: 'LOOKFAR_EXT.Editor.MenuHint',
        icon: 'fas fa-hammer',
        type: QualitiesEditor,
        restricted: true  // solo GM
    });
});

Hooks.once('ready', () => {
    const lookfar = game.modules.get('lookfar');
    if (!lookfar?.active) {
        console.warn(`${MODULE_ID}: Lookfar no está activo.`);
        return;
    }
    // dataLoader.loadData() se completa en el hook init de Lookfar.
    // En ready ya está listo, pero por seguridad esperamos un tick.
    setTimeout(() => injectQualities(), 500);
});

const TYPE_MAP = {
    weapon:    { containerKey: 'weaponsData',     arrayKey: 'weaponQualities',    capitalized: 'Weapon' },
    armor:     { containerKey: 'armorData',       arrayKey: 'armorQualities',     capitalized: 'Armor' },
    shield:    { containerKey: 'shieldsData',     arrayKey: 'shieldQualities',    capitalized: 'Shield' },
    accessory: { containerKey: 'accessoriesData', arrayKey: 'accessoryQualities', capitalized: 'Accessory' }
};

export async function injectQualities() {
    const dataLoader = await getDataLoader();
    if (!dataLoader) {
        console.warn(`${MODULE_ID}: dataLoader no disponible, no se pueden inyectar cualidades.`);
        return;
    }

    const data = game.settings.get(MODULE_ID, 'customQualities');
    const qualities = data.qualities ?? [];

    // 1) Limpiar inyecciones previas (marcadas con _lookfarExtension)
    for (const info of Object.values(TYPE_MAP)) {
        const container = dataLoader?.[info.containerKey];
        if (container && Array.isArray(container[info.arrayKey])) {
            container[info.arrayKey] = container[info.arrayKey].filter(q => !q._lookfarExtension);
        }
    }
    if (game.i18n.translations.qualities?.custom) {
        delete game.i18n.translations.qualities.custom;
    }

    // 2) Inyectar las nuevas
    for (const q of qualities) {
        if (!q.id || !Array.isArray(q.appliesTo) || q.appliesTo.length === 0) continue;

        // Traducciones (Lookfar las busca en i18n.translations.qualities.<categoria>.<id>)
        game.i18n.translations.qualities ??= {};
        game.i18n.translations.qualities.custom ??= {};
        const trans = { Description: q.description ?? '' };
        for (const type of q.appliesTo) {
            const cap = TYPE_MAP[type]?.capitalized;
            if (cap) trans[cap] = q.name;
        }
        game.i18n.translations.qualities.custom[q.id] = trans;

        // Entradas de datos (una por tipo)
        for (const type of q.appliesTo) {
            const info = TYPE_MAP[type];
            if (!info) continue;
            const container = dataLoader?.[info.containerKey];
            if (!container || !Array.isArray(container[info.arrayKey])) continue;
            container[info.arrayKey].push({
                id: q.id,
                cost: Number(q.cost) || 0,
                appliesTo: q.appliesTo,
                _lookfarExtension: true
            });
        }
    }

    console.log(`${MODULE_ID}: ${qualities.length} cualidades personalizadas inyectadas.`);
}