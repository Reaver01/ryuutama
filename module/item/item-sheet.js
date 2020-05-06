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
        let update = this.object.update(formData);
        if (formData["data.givenName"] !== undefined) {
            this.addRemoveEnchantment(false, undefined, undefined, formData["data.givenName"]);
        }
        return update;
    }

    /* -------------------------------------------- */

    /** @override */
    addRemoveEnchantment(remove, enchantmentName, enchantmentData, givenName) {
        // Initialize all variables
        const item = this.object;
        let accuracyBonus = Number(item.data.data.accuracyBonus);
        let additive;
        let broken;
        let defense = Number(item.data.data.defense);
        let durability;
        let enchantments = item.data.data.enchantments || [];
        let itemBonus = Number(item.data.data.itemBonus);
        let multiplicative;
        let newDurability;
        let penalty = Number(item.data.data.penalty);
        let price = Number(item.data.data.price);
        let priceFormulaA = `${price}`;
        let priceFormulaM;
        let size = Number(item.data.data.size);
        let unbreakable;

        enchantments = enchantments.slice();

        /* ------------------------------ */
        /* Reverse Calculations for Items */
        /* ------------------------------ */

        // Item price
        multiplicative = enchantments.filter(e => e.data.modType === "0");
        additive = enchantments.filter(e => e.data.modType === "1");
        additive.forEach(enchantment => {
            priceFormulaA += `-${enchantment.data.costMod}`;
        });
        price = eval(priceFormulaA);
        priceFormulaM = `${price}`;
        multiplicative.forEach(enchantment => {
            priceFormulaM += `/${enchantment.data.costMod}`;
        });
        price = eval(priceFormulaM);

        // Loop through enchantments
        enchantments.forEach(enchantment => {
            // Item size
            size -= enchantment.data.sizeMod;

            // Item specific modifications
            if (item.data.data.isArmor) {
                // Armor

                // Armor penalty
                penalty -= enchantment.data.armorPenaltyMod;

                // Plus One
                if (enchantment.data.plusOne) {
                    defense -= 1;
                }
            } else if (item.data.data.isWeapon) {
                // Weapons

                // Plus One
                if (enchantment.data.plusOne) {
                    accuracyBonus -= 1;
                }
            } else if (item.data.data.isTraveling) {
                // Traveling Gear

                // Plus One
                if (enchantment.data.plusOne) {
                    itemBonus -= 1;
                }
            }
        });

        // Item durability
        newDurability = size;

        /* -------------------------------- */
        /* Resolve Current Enchantment List */
        /* -------------------------------- */

        if (remove && enchantmentName !== undefined) {
            // Filter enchantments
            enchantments = enchantments.filter(e => e.name !== enchantmentName);
        } else if (enchantmentData !== undefined) {
            // Disalow duplicate enchantments
            let existing = enchantments.find(e => e.name === enchantmentName);
            if (existing !== undefined) return;
            // Push new enchantments to the array
            enchantments.push({
                name: enchantmentName,
                data: enchantmentData
            });
        }

        /* ---------------------------------- */
        /* Enchantment Calculations for Items */
        /* ---------------------------------- */

        // Item name
        let name = "";
        enchantments.forEach(enchantment => {
            name += `${enchantment.name} `;
        });
        if (givenName !== undefined) {
            name += givenName;
        } else {
            name += item.data.data.givenName;
        }


        // Item Price
        multiplicative = enchantments.filter(e => e.data.modType === "0");
        additive = enchantments.filter(e => e.data.modType === "1");
        priceFormulaM = `${price}`;
        multiplicative.forEach(enchantment => {
            priceFormulaM += `*${enchantment.data.costMod}`;
        });
        price = eval(priceFormulaM);
        priceFormulaA = `${price}`;
        additive.forEach(enchantment => {
            priceFormulaA += `+${enchantment.data.costMod}`;
        });
        price = eval(priceFormulaA);

        // Item durability
        durability = enchantments.filter(e => e.data.setDurability === true);
        if (durability.length > 0) {
            newDurability = Math.max.apply(Math, durability.map(function (e) {
                return e.data.durabilityValue;
            }));
        }

        // Loop through enchantments
        enchantments.forEach(enchantment => {
            // Item size
            size += enchantment.data.sizeMod;

            // Item durability
            if (enchantment.data.durabilityMultiplier !== 0) {
                newDurability *= enchantment.data.durabilityMultiplier;
            }

            // Item type specific modifications
            if (item.data.data.isArmor) {
                // Armor

                // Armor penalty
                penalty += enchantment.data.armorPenaltyMod;

                // Plus One
                if (enchantment.data.plusOne) {
                    defense += 1;
                }

            } else if (item.data.data.isWeapon) {
                // Weapons

                // Plus One
                if (enchantment.data.plusOne) {
                    accuracyBonus += 1;
                }
            } else if (item.data.data.isTraveling) {
                // Traveling Gear

                // Plus One
                if (enchantment.data.plusOne) {
                    itemBonus += 1;
                }
            }
        });

        // Unbreakable
        unbreakable = enchantments.find(e => e.data.unbreakable === true);
        if (unbreakable !== undefined) {
            newDurability = 9999;
        }

        // Broken
        broken = enchantments.find(e => e.data.unusable === true);
        if (broken !== undefined) {
            newDurability = 0;
        }

        // Build Update Data
        let updateData = {
            "name": name,
            "data.enchantments": enchantments,
            "data.price": price,
            "data.size": size,
            "data.durability": newDurability
        }
        if (item.data.data.isArmor) {
            // Armor
            updateData["data.penalty"] = penalty;
            updateData["data.defense"] = defense;
        } else if (item.data.data.isWeapon) {
            // Weapons
            updateData["data.accuracyBonus"] = accuracyBonus;
        } else if (item.data.data.isTraveling) {
            // Traveling Gear
            updateData["data.itemBonus"] = itemBonus;
        }

        // Update data
        item.update(updateData);
        if (enchantmentName !== undefined) {
            // Render sheet
            item.render(true);
        }
    }
}