import { MODULE_ID, ALL_TYPES } from './constants.js';
import { getAllCategories } from './categories.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class QualityDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(quality = {}) {
        super();
        this.quality = {
            id: '',
            name: '',
            description: '',
            cost: 0,
            category: 'custom',
            appliesTo: ['weapon'],
            ...quality
        };
        this._resolve = null;
    }

    static DEFAULT_OPTIONS = {
        id: 'lookfar-extension-quality-dialog',
        tag: 'form',
        classes: ['lookfar-extension-dialog'],
        window: {
            title: 'LOOKFAR_EXT.Dialog.Title',
            icon: 'fas fa-plus'
        },
        position: { width: 480, height: 'auto' },
        form: {
            handler: QualityDialog.#onSubmit,
            closeOnSubmit: true
        }
    };

    static PARTS = {
        form: { template: `modules/${MODULE_ID}/templates/quality-form.hbs` }
    };

    static open(quality = {}) {
        return new Promise(resolve => {
            const dialog = new QualityDialog(quality);
            dialog._resolve = resolve;
            dialog.render(true);
        });
    }

    async _prepareContext(options) {
        // Categorías: nativas (de Lookfar) + custom (del GM) + fallback 'custom'
        const categories = await getAllCategories();

        return {
            quality: this.quality,
            isNew: !this.quality._existing,
            categories,
            types: ALL_TYPES
        };
    }

    _onClose(options) {
        super._onClose(options);
        if (this._resolve) {
            this._resolve(null);
            this._resolve = null;
        }
    }

    static async #onSubmit(event, form, formData) {
        const data = formData.object;
        const rawName = (data.name ?? '').trim();

        const id = (data.id ?? '').trim() || rawName
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        if (!id)      { ui.notifications.error('El ID es obligatorio.'); return; }
        if (!rawName) { ui.notifications.error('El nombre es obligatorio.'); return; }

        const appliesTo = ALL_TYPES
            .map(t => t.key)
            .filter(key => data[`appliesTo.${key}`]);

        if (appliesTo.length === 0) {
            ui.notifications.error('Selecciona al menos un tipo de objeto.');
            return;
        }

        const category = (data.category ?? 'custom').trim() || 'custom';

        const quality = {
            id,
            name: rawName,
            description: (data.description ?? '').trim(),
            cost: Number(data.cost) || 0,
            category,
            appliesTo
        };

        if (this._resolve) {
            this._resolve(quality);
            this._resolve = null;
        }
    }
}