import { MODULE_ID } from './constants.js';
import { injectQualities } from './injector.js';

export function registerSettings() {
    // Cualidades personalizadas
    game.settings.register(MODULE_ID, 'customQualities', {
        scope: 'world',
        config: false,
        type: Object,
        default: { qualities: [] },
        onChange: () => {
            injectQualities();
            ui.notifications.info('Lookfar Extension: cualidades actualizadas.');
        }
    });

    // Categorías personalizadas
    game.settings.register(MODULE_ID, 'customCategories', {
        scope: 'world',
        config: false,
        type: Array,
        default: [],
        onChange: () => {
            injectQualities();
            ui.notifications.info('Lookfar Extension: categorías actualizadas.');
        }
    });
}