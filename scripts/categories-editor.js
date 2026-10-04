import { MODULE_ID } from './constants.js';
import {
    getNativeCategories,
    getCustomCategories,
    addCategory,
    removeCategory
} from './categories.js';
import { injectQualities } from './injector.js';
import { getQualities } from './qualities.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CategoriesEditor extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: 'lookfar-extension-categories-editor',
        tag: 'form',
        classes: ['lookfar-extension-categories-editor'],
        window: {
            title: 'LOOKFAR_EXT.CategoriesEditor.Title',
            icon: 'fas fa-tags'
        },
        position: { width: 520, height: 'auto' },
        form: {
            handler: CategoriesEditor.#onSubmit,
            closeOnSubmit: false
        },
        actions: {
            deleteCategory: CategoriesEditor.#onDeleteCategory
        }
    };

    static PARTS = {
        form: { template: `modules/${MODULE_ID}/templates/categories-editor.hbs` }
    };

    async _prepareContext(options) {
        const native = await getNativeCategories();
        const custom = getCustomCategories();
        const qualities = getQualities();

        // Contar cualidades por categoría
        const usage = {};
        for (const q of qualities) {
            const cat = q.category || 'custom';
            usage[cat] = (usage[cat] || 0) + 1;
        }

        return {
            native: native.map(name => ({
                name,
                count: usage[name] || 0
            })),
            custom: custom.map(name => ({
                name,
                count: usage[name] || 0
            })),
            hasCustom: custom.length > 0
        };
    }

    static async #onSubmit(event, form, formData) {
        const name = (formData.object.name ?? '').trim();
        if (!name) return;

        try {
            const clean = await addCategory(name);
            await injectQualities();
            ui.notifications.info(`Categoría "${clean}" añadida.`);
            this.render();
        } catch (err) {
            ui.notifications.error(err.message);
        }
    }

    static async #onDeleteCategory(event, target) {
        const name = target.dataset.name;
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: 'Eliminar Categoría' },
            content: `<p>¿Eliminar la categoría <strong>${name}</strong>?</p>
                      <p>Las cualidades en esta categoría se moverán a la categoría <code>custom</code>.</p>`
        });
        if (!confirmed) return;

        try {
            const reassigned = await removeCategory(name);
            await injectQualities();
            ui.notifications.info(
                `Categoría "${name}" eliminada.` +
                (reassigned > 0 ? ` ${reassigned} cualidad(es) movida(s) a "custom".` : '')
            );
            this.render();
        } catch (err) {
            ui.notifications.error(err.message);
        }
    }
}