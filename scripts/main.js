import { dataLoader } from '/modules/lookfar/scripts/dataLoader.js';

const MODULE_ID = 'lookfar-extension';

/**
 * Lee una RollTable y devuelve un array de cualidades con el formato que usa Lookfar.
 * Cada resultado de la tabla debe tener:
 *   - name:        Nombre de la cualidad
 *   - description: Descripción del efecto
 *   - flags.lookfar-extension.cost:      Coste (número)
 *   - flags.lookfar-extension.appliesTo: Array de tipos (ej. ["weapon"])
 */
function getQualitiesFromTable(tableId, defaultKind) {
    if (!tableId) return [];

    const table = game.tables.get(tableId);
    if (!table) {
        console.warn(`${MODULE_ID}: No se encontró la RollTable con ID ${tableId}`);
        return [];
    }

    return table.results
        .filter(r => r.type === CONST.TABLE_RESULT_TYPES.TEXT)
        .map(result => {
            const flags = result.flags?.[MODULE_ID] ?? {};
            return {
                name: result.name,
                description: result.description || result.text || '',
                cost: Number(flags.cost) || 0,
                appliesTo: Array.isArray(flags.appliesTo)
                    ? flags.appliesTo
                    : [defaultKind]
            };
        });
}

/**
 * Inyecta las cualidades de las tablas en el dataLoader de Lookfar.
 */
function injectQualities() {
    const weaponTableId = game.settings.get(MODULE_ID, 'weaponTableId');
    const armorTableId = game.settings.get(MODULE_ID, 'armorTableId');
    const shieldTableId = game.settings.get(MODULE_ID, 'shieldTableId');
    const accessoryTableId = game.settings.get(MODULE_ID, 'accessoryTableId');

    const injections = [
        { kind: 'weapon', tableId: weaponTableId, path: 'weaponsData.weaponQualities' },
        { kind: 'armor', tableId: armorTableId, path: 'armorData.armorQualities' },
        { kind: 'shield', tableId: shieldTableId, path: 'shieldsData.shieldQualities' },
        { kind: 'accessory', tableId: accessoryTableId, path: 'accessoriesData.accessoryQualities' }
    ];

    for (const { kind, tableId, path } of injections) {
        if (!tableId) continue;

        const custom = getQualitiesFromTable(tableId, kind);
        if (!custom.length) continue;

        // Navegamos por la ruta (ej. "weaponsData.weaponQualities")
        const parts = path.split('.');
        const container = parts.slice(0, -1).reduce((obj, key) => obj?.[key], dataLoader);
        const arrayKey = parts[parts.length - 1];

        if (!container) {
            console.warn(`${MODULE_ID}: No se encontró la ruta ${path} en dataLoader.`);
            continue;
        }

        const existing = container[arrayKey] ?? [];
        container[arrayKey] = [...existing, ...custom];

        console.log(`${MODULE_ID}: ${custom.length} cualidades de tipo "${kind}" inyectadas.`);
    }
}

Hooks.once('init', () => {
    // Registrar los ajustes para que el GM configure las tablas
    const settingConfig = {
        scope: 'world',
        config: true,
        type: String,
        default: ''
    };

    game.settings.register(MODULE_ID, 'weaponTableId', {
        ...settingConfig,
        name: 'Tabla de Cualidades (Armas)',
        hint: 'ID de la RollTable con cualidades para armas.'
    });

    game.settings.register(MODULE_ID, 'armorTableId', {
        ...settingConfig,
        name: 'Tabla de Cualidades (Armaduras)',
        hint: 'ID de la RollTable con cualidades para armaduras.'
    });

    game.settings.register(MODULE_ID, 'shieldTableId', {
        ...settingConfig,
        name: 'Tabla de Cualidades (Escudos)',
        hint: 'ID de la RollTable con cualidades para escudos.'
    });

    game.settings.register(MODULE_ID, 'accessoryTableId', {
        ...settingConfig,
        name: 'Tabla de Cualidades (Accesorios)',
        hint: 'ID de la RollTable con cualidades para accesorios.'
    });
});

Hooks.once('ready', () => {
    // En este punto, Lookfar ya ha ejecutado dataLoader.loadData() en su propio hook 'init'
    // (porque await dataLoader.loadData() se completa antes de que se dispare 'ready')
    injectQualities();
});