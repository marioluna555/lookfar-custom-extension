import { MODULE_ID } from './constants.js';
import { injectQualities } from './injector.js';
import {
    getQualities,
    saveQuality,
    deleteQuality,
    findQuality
} from './qualities.js';
import { QualityDialog } from './quality-dialog.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class QualitiesEditor extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: 'lookfar-extension-editor',
        tag: 'form',
        classes: ['lookfar-extension-editor'],
        window: {
            title: 'LOOKFAR_EXT.Editor.Title',
            icon: 'fas fa-hammer',
            resizable: true
        },
        position: { width: 820, height: 'auto' },
        actions: {
            addQuality: QualitiesEditor.#onAddQuality,
            editQuality: QualitiesEditor.#onEditQuality,
            deleteQuality: QualitiesEditor.#onDeleteQuality
        }
    };

    static PARTS = {
        form: { template: `modules/${MODULE_ID}/templates/editor.hbs` }
    };

    async _prepareContext(options) {
        const qualities = getQualities();
        return {
            qualities,
            hasQualities: qualities.length > 0
        };
    }

    static async #onAddQuality(event, target) {
        const quality = await QualityDialog.open({});
        if (!quality) return;

        try {
            await saveQuality(quality);
            await injectQualities();
            ui.notifications.info(`Cualidad "${quality.name}" añadida.`);
            this.render();
        } catch (err) {
            ui.notifications.error(err.message);
        }
    }

    static async #onEditQuality(event, target) {
        const id = target.dataset.id;
        const existing = findQuality(id);
        if (!existing) return;

        const updated = await QualityDialog.open({ ...existing, _existing: true });
        if (!updated) return;

        try {
            await saveQuality(updated, id);
            await injectQualities();
            ui.notifications.info(`Cualidad "${updated.name}" actualizada.`);
            this.render();
        } catch (err) {
            ui.notifications.error(err.message);
        }
    }

    static async #onDeleteQuality(event, target) {
        const id = target.dataset.id;
        const existing = findQuality(id);
        if (!existing) return;

        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: 'Eliminar Cualidad' },
            content: `<p>¿Eliminar la cualidad <strong>${existing.name}</strong> (<code>${id}</code>)?</p>`
        });
        if (!confirmed) return;

        try {
            await deleteQuality(id);
            await injectQualities();
            ui.notifications.info(`Cualidad "${existing.name}" eliminada.`);
            this.render();
        } catch (err) {
            ui.notifications.error(err.message);
        }
    }
}