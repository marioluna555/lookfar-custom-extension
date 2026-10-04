import { MODULE_ID } from './constants.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class QualityDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor(quality = {}) {
        super();
        this.quality = {
            id: '',
            name: '',
            description: '',
            cost: 0,
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
        return {
            quality: this.quality,
            isNew: !this.quality._existing,
            types: [
                { key: 'weapon',    label: 'Arma' },
                { key: 'armor',     label: 'Armadura' },
                { key: 'shield',    label: 'Escudo' },
                { key: 'accessory', label: 'Accesorio' }
            ]
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

        if (!id)          { ui.notifications.error('El ID es obligatorio.'); return; }
        if (!rawName)     { ui.notifications.error('El nombre es obligatorio.'); return; }

        const appliesTo = ['weapon', 'armor', 'shield', 'accessory']
            .filter(t => data[`appliesTo.${t}`]);

        if (appliesTo.length === 0) {
            ui.notifications.error('Selecciona al menos un tipo de objeto.');
            return;
        }

        const quality = {
            id,
            name: rawName,
            description: (data.description ?? '').trim(),
            cost: Number(data.cost) || 0,
            appliesTo
        };

        if (this._resolve) {
            this._resolve(quality);
            this._resolve = null;
        }
    }
}