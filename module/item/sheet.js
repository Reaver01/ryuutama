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
                initial: "enchantments"
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
        if (data.data.givenName === "") {
            data.data.givenName = data.item.name;
        }
        return data;
    }

    /* -------------------------------------------- */

    _onDragOver(event) {
        event.preventDefault();
        return false;
    }

    /* -------------------------------------------- */

    /** @override */
    async _onDrop(event) {
        event.preventDefault();

        // Try to extract the data
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData('text/plain'));
            if (data.type !== "Item") return;
        } catch (err) {
            return false;
        }

        const parentItem = this;
        // Case 1 - Import from a Compendium pack
        if (data.pack) {
            const pack = game.packs.find(p => p.collection === data.pack);
            pack.getEntity(data.id).then(item => {
                if (!item || item.data.type !== "enchantment") return;

                return parentItem.addRemoveEnchantment(false, item.data.name, item.data.data);
            });
        }

        // Case 2 - Data explicitly provided
        else if (data.data) {
            console.log("Data explicitly provided");
        }

        // Case 3 - Import from World entity
        else {
            let item = game.items.get(data.id);
            if (!item || item.data.type !== "enchantment") return;

            return parentItem.addRemoveEnchantment(false, item.data.name, item.data.data);
        }
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

        this.form.ondragover = ev => this._onDragOver(ev);
        this.form.ondrop = ev => this._onDrop(ev);

        // Delete Enchantment
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            this.addRemoveEnchantment(true, li.data("itemId"));
        });
    }

    /* -------------------------------------------- */

    /** @override */
    _updateObject(event, formData) {
        // Update the Item
        return this.object.update(formData);
    }

    /* -------------------------------------------- */

    /** @override */
    addRemoveEnchantment(remove, enchantmentName, enchantmentData) {
        const item = this.object;
        let multiplicative;
        let additive;
        let durability;
        let newDurability;
        let price = 0 + item.data.data.price;
        let priceFormulaA = `${price}`;
        let priceFormulaM;
        let size = 0 + item.data.data.size;
        let enchantments = item.data.data.enchantments || [];
        enchantments = enchantments.slice();

        // Reverse price calculation
        multiplicative = enchantments.filter(e => e.data.modType === "0");
        additive = enchantments.filter(e => e.data.modType === "1");
        additive.forEach(enchantment => {
            priceFormulaA += `-${enchantment.data.costMod}`
        });
        price = eval(priceFormulaA);
        priceFormulaM = `${price}`;
        multiplicative.forEach(enchantment => {
            priceFormulaM += `/${enchantment.data.costMod}`
        });
        price = eval(priceFormulaM);

        // Loop through enchantments
        enchantments.forEach(enchantment => {
            // Reverse size modifier
            size -= enchantment.data.sizeMod;
        });

        durability = enchantments.filter(e => e.data.setDurability === true);
        if (durability.length > 0) {
            newDurability = size;
        }

        // Build array based on adding or removing enchantments
        if (remove) {
            // Filter enchantments
            enchantments = enchantments.filter(e => e.name !== enchantmentName);
        } else {
            // Disalow duplicate enchantments
            let existing = enchantments.find(e => e.name === enchantmentName);
            if (existing !== undefined) return;
            enchantments.push({
                name: enchantmentName,
                data: enchantmentData
            });
        }

        // Change name
        let name = "";
        enchantments.forEach(enchantment => {
            name += `${enchantment.name} `
        });
        name += item.data.data.givenName;

        // Calculate price
        multiplicative = enchantments.filter(e => e.data.modType === "0");
        additive = enchantments.filter(e => e.data.modType === "1");
        priceFormulaM = `${price}`;
        multiplicative.forEach(enchantment => {
            priceFormulaM += `*${enchantment.data.costMod}`
        });
        price = eval(priceFormulaM);
        priceFormulaA = `${price}`;
        additive.forEach(enchantment => {
            priceFormulaA += `+${enchantment.data.costMod}`
        });
        price = eval(priceFormulaA);

        // Set enchantment durability
        durability = enchantments.filter(e => e.data.setDurability === true);
        if (durability.length > 0) {
            newDurability = Math.max.apply(Math, durability.map(function (e) {
                return e.data.durabilityValue;
            }));
        }

        // Loop through enchantments
        enchantments.forEach(enchantment => {
            // Add size modifier
            size += enchantment.data.sizeMod;
        });

        // Render and update sheet
        item.render(true);
        item.update({
            "name": name,
            "data.enchantments": enchantments,
            "data.price": price,
            "data.size": size,
            "data.durability": newDurability
        });
    }
}