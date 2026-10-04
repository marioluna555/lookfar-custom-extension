import { MODULE_ID } from './constants.js';
import { registerSettings } from './settings.js';
import { injectQualities } from './injector.js';
import { QualitiesEditor } from './qualities-editor.js';
import { registerForgeHook } from './forge-hook.js';
import { invalidateCategoriesCache } from './forge-hook.js';

Handlebars.registerHelper('not', v => !v);
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('lfIncludes', (arr, v) => Array.isArray(arr) && arr.includes(v));

Hooks.once('init', () => {
    registerSettings();
    registerForgeHook();
    
    game.settings.registerMenu(MODULE_ID, 'qualitiesEditor', {
        name: 'LOOKFAR_EXT.Editor.MenuName',
        label: 'LOOKFAR_EXT.Editor.MenuLabel',
        hint: 'LOOKFAR_EXT.Editor.MenuHint',
        icon: 'fas fa-hammer',
        type: QualitiesEditor,
        restricted: true
    });
});

Hooks.once('ready', () => {
    if (!game.modules.get('lookfar')?.active) {
        console.warn(`${MODULE_ID}: Lookfar no está activo.`);
        return;
    }
    setTimeout(() => injectQualities(), 500);
});