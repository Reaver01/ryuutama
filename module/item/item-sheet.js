import {
    RYUU
} from "../config.js";

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
            data = JSON.parse(event.dataTransfer.getData("text/plain"));
            if (data.type !== "Item") return;
        } catch (err) {
            return false;
        }

        const parentItem = this;

        // Case 1 - Import from a Compendium pack
        if (data.pack) {
            const pack = game.packs.find(p => p.collection === data.pack);
            pack.getEntity(data.id).then(item => {
                if (!item) return;
                if (item.type === "enchantment" && !RYUU.NO_ENCHANTS.includes(parentItem.item.type)) {
                    // Enchant items that aren't containers or animals
                    return parentItem.addRemoveEnchantment(false, item.data.name, item.data.data);
                } else if (!RYUU.NO_STORE.includes(item.type) && RYUU.STORAGE.includes(parentItem.item.type)) {
                    // Check if container is inside a container
                    if (parentItem.item.data.data.container) {
                        return;
                    }
                    // Add items to container or animal
                    return parentItem.addRemoveItem(false, item.data);
                } else if (item.type === "feature" && parentItem.item.type === "class") {
                    // Add feature to class
                    parentItem.addRemoveFeature(false, item.data);
                }

            });
        }

        // Case 2 - Data explicitly provided
        else if (data.data) {
            const actor = game.actors.get(data.actorId);
            const item = actor.items.find(i => i.data._id === data.data._id);
            if (!item || parentItem.item.options.actor.id !== actor.id || item.data.data.container === parentItem.item.id) return;

            // Container/Animal
            if (!RYUU.NO_STORE.includes(item.type) && RYUU.STORAGE.includes(parentItem.item.type) && item.data._id !== parentItem.item.id) {

                // Check if container is inside a container
                if (parentItem.item.data.data.container) {
                    return;
                }

                // Check if container being dropped has any items in it
                if (item.data.type === "container") {
                    const droppedHolding = actor.items.filter(i => i.data.data.container === item.data._id);

                    // If the container does have items in it, dump items in and delete container.
                    if (droppedHolding.length > 0) {
                        let availableSpace = parentItem.item.data.data.canHold - parentItem.item.data.data.holdingSize;
                        let holding = parentItem.item.data.data.holding;
                        holding = holding.slice();

                        let updates = [];
                        droppedHolding.forEach(i => {
                            if (i.data.data.size <= availableSpace) {
                                updates.push({
                                    _id: i._id,
                                    "data.container": parentItem.item.id
                                });
                                holding.push({
                                    id: i._id,
                                    name: i.name,
                                    equippable: RYUU.EQUIPPABLE.includes(i.data.type),
                                    equip: i.data.data.equip,
                                    img: i.img,
                                    size: i.data.data.size
                                });
                                availableSpace -= i.data.data.size;
                            } else {
                                updates.push({
                                    _id: i._id,
                                    "data.container": ""
                                });
                            }
                        });

                        parentItem.item.update({
                            "data.holding": holding
                        });

                        await actor.updateEmbeddedEntity("OwnedItem", updates);
                        await actor.deleteEmbeddedEntity("OwnedItem", item.data._id);
                        return;
                    }
                }

                // If item already resides in a container, remove it from the original
                if (item.data.data.container) {
                    const originalContainer = actor.items.find(i => i.id === item.data.data.container);
                    if (originalContainer) {
                        let originalHolding = originalContainer.data.data.holding;
                        originalHolding = originalHolding.filter(i => i.id !== item.id);

                        originalContainer.update({
                            "data.holding": originalHolding
                        });
                    }
                }

                // Get all items already in container and make sure we don't dupe
                let holding = parentItem.item.data.data.holding;
                holding = holding.slice();
                const found = holding.find(i => i.id === item._id);
                if (found || parentItem.item.data.data.holdingSize + item.data.data.size > parentItem.item.data.data.canHold) return;

                // Add items to container or animal
                await actor.updateEmbeddedEntity("OwnedItem", {
                    _id: item._id,
                    "data.container": parentItem.item.id
                });

                // Push the item to the container
                holding.push({
                    id: item._id,
                    name: item.name,
                    equippable: RYUU.EQUIPPABLE.includes(item.data.type),
                    equip: item.data.data.equip,
                    img: item.img,
                    size: item.data.data.size
                });
                parentItem.item.update({
                    "data.holding": holding
                });
            }
        }

        // Case 3 - Import from World entity
        else {
            let item = game.items.get(data.id);
            if (!item) return;

            if (item.type === "enchantment" && !RYUU.NO_ENCHANTS.includes(parentItem.item.type)) {
                // Enchant items that aren't containers or animals
                return parentItem.addRemoveEnchantment(false, item.data.name, item.data.data);
            } else if (!RYUU.NO_STORE.includes(item.type) && RYUU.STORAGE.includes(parentItem.item.type)) {
                // Check if container is inside a container
                if (parentItem.item.data.data.container) {
                    return;
                }
                // Add items to container or animal
                return parentItem.addRemoveItem(false, item.data);
            } else if (item.type === "feature" && parentItem.item.type === "class") {
                // Add feature to class
                parentItem.addRemoveFeature(false, item.data);
            }
        }
    }

    /* -------------------------------------------- */

    addRemoveFeature(remove, feature) {
        const item = this.object;
        let features = item.data.data.features || [];
        features = features.slice();
        console.log(item);
        console.log(feature);

        if (remove) {
            // Filter enchantments
            features = features.filter(e => e.name !== feature);
        } else if (feature.data) {
            // Disalow duplicate enchantments
            let existing = features.find(e => e.name === feature.name);
            if (existing) return;
            // Push new enchantments to the array
            features.push({
                name: feature.name,
                data: feature.data
            });
        }

        const updateData = {
            "data.features": features
        };

        // Update data
        item.update(updateData);
    }

    /* -------------------------------------------- */

    addRemoveItem(remove, data) {
        let id = data._id;
        const item = this.object;
        const actor = item.options.actor;
        let holding = item.data.data.holding || [];
        holding = holding.slice();

        if (id) {
            if (remove) {
                // Filter container contents
                holding = holding.filter(i => i.id !== id);

                // Remove the container id from the item in the actor's inventory
                const actorItem = actor.items.find(i => i.data._id === data.id);

                actor.updateEmbeddedEntity("OwnedItem", {
                    _id: actorItem.data._id,
                    "data.container": ""
                });

            } else {
                if (actor) {
                    // Specify container id on item in actor's inventory
                    data.data.container = item.data._id;

                    // Create the item entity in the actor's inventory
                    actor.createEmbeddedEntity("OwnedItem", data);
                }
            }
        }

        // Update item
        item.update({
            "data.holding": holding
        });
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
            this.addRemoveFeature(true, li.data("itemId"));
            if (this.object.data.data.holding) {
                let item = this.object.data.data.holding.find(i => i.id === li.data("itemId"));
                if (item.id) {
                    item._id = item.id;
                }
                this.addRemoveItem(true, item);
            }
        });

        if (this.item.owner) {
            let handler = ev => this._onDragItemStart(ev);
            html.find("li.item").each((i, li) => {
                if (li.classList.contains("inventory-header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
        }
    }

    /* -------------------------------------------- */

    /**
     * Default handler for beginning a drag-drop workflow of an Owned Item on an Actor Sheet
     * @param event
     * @private
     */
    _onDragItemStart(event) {
        const li = event.currentTarget;
        const item = this.actor.getOwnedItem(li.dataset.itemId);
        const dragData = {
            type: "Item",
            actorId: this.actor.id,
            data: item.data
        };
        if (this.actor.isToken) dragData.tokenId = this.actor.token.id;
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    /* -------------------------------------------- */

    /** @override */
    _updateObject(event, formData) {
        // Update the Item
        let update = this.object.update(formData);
        if (formData["data.givenName"]) {
            this.addRemoveEnchantment(false, undefined, undefined, formData["data.givenName"]);
        }
        return update;
    }

    /* -------------------------------------------- */

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

        if (remove && enchantmentName) {
            // Filter enchantments
            enchantments = enchantments.filter(e => e.name !== enchantmentName);
        } else if (enchantmentData) {
            // Disalow duplicate enchantments
            let existing = enchantments.find(e => e.name === enchantmentName);
            if (existing) return;
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
        if (givenName) {
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
            newDurability = Math.max.apply(Math, durability.map(function(e) {
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
        if (unbreakable) {
            newDurability = 9999;
        }

        // Broken
        broken = enchantments.find(e => e.data.unusable === true);
        if (broken) {
            newDurability = 0;
        }

        // Build Update Data
        let updateData = {
            "name": name,
            "data.enchantments": enchantments,
            "data.price": price,
            "data.size": size,
            "data.durability": newDurability
        };
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
        if (enchantmentName) {
            // Render sheet
            item.render(true);
        }
    }
}