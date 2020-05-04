import {
    RYUU
} from '../config.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class RyuutamaItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ryuutama", "sheet", "item"],
            width: 520,
            height: 480,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "description"
            }]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    get template() {
        const path = "systems/ryuutama/templates/item/";
        return `${path}/${this.item.data.type}.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        data.dtypes = ["String", "Number", "Boolean"];
        return data;
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition(options = {}) {
        const position = super.setPosition(options);
        const sheetBody = this.element.find(".sheet-body");
        const bodyHeight = position.height - 192;
        sheetBody.css("height", bodyHeight);
        return position;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Add or Remove Attribute
        html.find(".attributes").on("click", ".attribute-control", this._onClickAttributeControl.bind(this));
    }

    /* -------------------------------------------- */

    /**
     * Listen for click events on an attribute control to modify the composition of attributes in the sheet
     * @param {MouseEvent} event    The originating left click event
     * @private
     */
    async _onClickAttributeControl(event) {
        event.preventDefault();
        const a = event.currentTarget;
        const action = a.dataset.action;
        const attrs = this.object.data.data.attributes;
        const form = this.form;

        // Add new attribute
        if (action === "create") {
            const nk = Object.keys(attrs).length + 1;
            let newKey = document.createElement("div");
            newKey.innerHTML = `<input type="text" name="data.attributes.attr${nk}.key" value="attr${nk}"/>`;
            newKey = newKey.children[0];
            form.appendChild(newKey);
            await this._onSubmit(event);
        }

        // Remove existing attribute
        else if (action === "delete") {
            const li = a.closest(".attribute");
            li.parentElement.removeChild(li);
            await this._onSubmit(event);
        }
    }

    /* -------------------------------------------- */

    /** @override */
    _updateObject(event, formData) {
        // Update the Item
        return this.object.update(formData);
    }
}