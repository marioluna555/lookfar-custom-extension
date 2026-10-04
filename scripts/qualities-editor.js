import { MODULE_ID, injectQualities } from './main.js';
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
        position: { width: 760, height: 'auto' },
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
        const data = game.settings.get(MODULE_ID, 'customQualities');
        return {
            qualities: data.qualities ?? [],
            hasQualities: (data.qualities ?? []).length > 0
        };
    }

    static async #onAddQuality(event, target) {
        const quality = await QualityDialog.open({});
        if (quality) await this._saveQuality(quality);
    }

    static async #onEditQuality(event, target) {
        const id = target.dataset.id;
        const data = game.settings.get(MODULE_ID, 'customQualities');
        const quality = data.qualities.find(q => q.id === id);
        if (!quality) return;
        const updated = await QualityDialog.open({ ...quality, _existing: true });
        if (updated) await this._saveQuality(updated, id);
    }

    static async #onDeleteQuality(event, target) {
        const id = target.dataset.id;
        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: 'Eliminar Cualidad' },
            content: `<p>¿Eliminar la cualidad <strong>${id}</strong>?</p>`
        });
        if (!confirmed) return;
        const data = game.settings.get(MODULE_ID, 'customQualities');
        data.qualities = (data.qualities ?? []).filter(q => q.id !== id);
        await game.settings.set(MODULE_ID, 'customQualities', data);
        injectQualities();
        this.render();
    }

    async _saveQuality(quality, originalId = null) {
        const data = game.settings.get(MODULE_ID, 'customQualities');
        const list = data.qualities ?? [];
        if (originalId) {
            const idx = list.findIndex(q => q.id === originalId);
            if (idx >= 0) list[idx] = quality;
            else list.push(quality);
        } else {
            if (list.some(q => q.id === quality.id)) {
                ui.notifications.error(`Ya existe una cualidad con el id "${quality.id}".`);
                return;
            }
            list.push(quality);
        }
        data.qualities = list;
        await game.settings.set(MODULE_ID, 'customQualities', data);
        injectQualities();
        this.render();
    }
}