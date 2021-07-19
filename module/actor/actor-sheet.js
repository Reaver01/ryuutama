import {
    RYUU
} from "../config.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class RyuutamaActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ryuutama", "sheet", "actor", "character"],
            width: 600,
            height: 700,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "equipped"
            }]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    get template() {
        const path = "systems/ryuutama/templates/actor/";
        return `${path}/${this.actor.data.type}.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        /*
        data.dtypes = ["String", "Number", "Boolean"];
        for (let attr of Object.values(data.data.attributes)) {
            attr.isCheckbox = attr.dtype === "Boolean";
        }
        */

        // Prepare items.
        if (this.actor.data.type === "character") {
            this._prepareCharacterItems(data);
        }
        if (this.actor.data.type === "monster") {
            this._prepareMonsterItems(data);
        }

        return data;
    }

    /* -------------------------------------------- */

    /** @override */
    async _onDrop(event) {
        event.preventDefault();

        // Get dropped data
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData("text/plain"));
        } catch (err) {
            return false;
        }

        // Handle dropping to another sheet
        if (data) {
            if (this.actor.owner && data.actorId !== undefined && data.actorId === this.actor.id && data.data !== undefined) {

                if (event.toElement.parentNode.dataset.itemId !== undefined) {
                    const actor = game.actors.get(data.actorId);
                    let container = actor.items.find(i => i.data._id === event.toElement.parentNode.dataset.itemId);
                    if (event.toElement.parentNode.dataset.parentId !== undefined) {
                        container = actor.items.find(i => i.data._id === event.toElement.parentNode.dataset.parentId);
                    }
                    const item = actor.items.find(i => i.data._id === data.data._id);
                    if (container !== undefined && container.data.data.canHold !== undefined && container.data.data.holdingSize !== undefined) {
                        if (!item || item.data.data.container === container.id) {
                            return;
                        }
                        if (!RYUU.NO_STORE.includes(item.type) && RYUU.STORAGE.includes(container.type) && item.data._id !== container.id) {

                            // Check if container is inside a container
                            if (container.data.data.container !== undefined && container.data.data.container !== "") {
                                return;
                            }

                            // Check if container being dropped has any items in it
                            if (item.data.type === "container") {
                                const droppedHolding = actor.items.filter(i => i.data.data.container === item.data._id);

                                // If the container does have items in it, dump items in and delete container.
                                if (droppedHolding.length > 0) {
                                    let availableSpace = container.data.data.canHold - container.data.data.holdingSize;
                                    let holding = container.data.data.holding;
                                    holding = holding.slice();
                                    let updates = [];
                                    droppedHolding.forEach(i => {
                                        if (i.data.data.size <= availableSpace) {
                                            updates.push({
                                                _id: i._id,
                                                "data.container": container.id
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

                                    container.update({
                                        "data.holding": holding
                                    });

                                    await actor.updateEmbeddedEntity("OwnedItem", updates);
                                    await actor.deleteEmbeddedEntity("OwnedItem", item.data._id);
                                    return;
                                }
                            }

                            let updates = [];

                            // If item already resides in a container, remove it from the original
                            if (item.data.data.container !== undefined && item.data.data.container !== "") {
                                const originalContainer = actor.items.find(i => i.id === item.data.data.container);
                                if (originalContainer !== undefined) {
                                    let originalHolding = originalContainer.data.data.holding;
                                    originalHolding = originalHolding.filter(i => i.id !== item.id);

                                    updates.push({
                                        _id: originalContainer.data._id,
                                        "data.holding": originalHolding
                                    });
                                }
                            }

                            // Get all items already in container and make sure we don't dupe
                            let holding = container.data.data.holding;
                            holding = holding.slice();
                            const found = holding.find(i => i.id === item._id);
                            if (found !== undefined || container.data.data.holdingSize + item.data.data.size > container.data.data.canHold) {
                                return;
                            }

                            // Add items to container or animal
                            updates.push({
                                _id: item._id,
                                "data.container": container.id,
                                "data.equipped": false
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
                            updates.push({
                                _id: container.id,
                                "data.holding": holding
                            });

                            await actor.updateEmbeddedEntity("OwnedItem", updates);
                        }
                    } else {
                        // Remove item from container if it's dropped somewhere else outside the container
                        const actor = game.actors.get(data.actorId);
                        const item = actor.items.find(i => i.data._id === data.data._id);
                        if (!item) {
                            return;
                        }
                        const container = actor.items.find(i => i.data._id === item.data.data.container);
                        if (!container) {
                            return;
                        }
                        let holding = container.data.data.holding || [];
                        holding = holding.filter(i => i.id !== item.data._id);
                        let updates = [{
                                _id: container.data._id,
                                "data.holding": holding
                            },
                            {
                                _id: item.data._id,
                                "data.container": ""
                            }
                        ];

                        await actor.updateEmbeddedEntity("OwnedItem", updates);
                    }
                } else {
                    // Remove item from container if it's dropped somewhere else outside the container
                    const actor = game.actors.get(data.actorId);
                    const item = actor.items.find(i => i.data._id === data.data._id);
                    if (!item) {
                        return;
                    }
                    const container = actor.items.find(i => i.data._id === item.data.data.container);
                    if (!container) {
                        return;
                    }
                    let holding = container.data.data.holding || [];
                    holding = holding.filter(i => i.id !== item.data._id);
                    let updates = [{
                            _id: container.data._id,
                            "data.holding": holding
                        },
                        {
                            _id: item.data._id,
                            "data.container": ""
                        }
                    ];

                    await actor.updateEmbeddedEntity("OwnedItem", updates);
                }
            }

            // Call parent on drop logic
            return super._onDrop(event);
        }
    }

    /* -------------------------------------------- */

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor;

        // Initialize containers.
        const gear = [];
        const equipment = [];
        const containers = [];
        const animals = [];
        const classes = [];
        const features = [];
        const spells = {
            "low": [],
            "mid": [],
            "high": []
        };

        // Iterate through items, allocating to containers
        // let totalWeight = 0;
        for (let i of sheetData.items) {
            let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type === "item" && (item.container === undefined || item.container === "")) {
                gear.push(i);
            }
            // Append to equipment.
            if ((i.type === "weapon" || i.type === "armor" || i.type === "shield" || i.type === "traveling") && (item.container === undefined || item.container === "")) {
                equipment.push(i);
            }
            // Append to container.
            if (i.type === "container" && (item.container === undefined || item.container === "")) {
                containers.push(i);
            }
            // Append to container.
            if (i.type === "animal") {
                animals.push(i);
            }
            // Append to container.
            if (i.type === "class") {
                classes.push(i);
            }
            // Append to features.
            else if (i.type === "feature") {
                features.push(i);
            }
            // Append to spells.
            else if (i.type === "spell") {
                if (item.level != undefined) {
                    spells[item.level].push(i);
                }
            }
        }

        // Assign and return
        actorData.gear = gear;
        actorData.equipment = equipment;
        actorData.containers = containers;
        actorData.animals = animals;
        actorData.classes = classes;
        actorData.features = features;
        actorData.spells = spells;
    }

    /* -------------------------------------------- */

    /**
     * Organize and classify Items for Monster sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareMonsterItems(sheetData) {
        const actorData = sheetData.actor;

        // Initialize containers.
        const gear = [];
        const spells = {
            "low": [],
            "mid": [],
            "high": []
        };

        // Iterate through items, allocating to containers
        // let totalWeight = 0;
        for (let i of sheetData.items) {
            let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type !== "spell" && (item.container === undefined || item.container === "")) {
                gear.push(i);
            }
            // Append to spells.
            else if (i.type === "spell") {
                if (item.level != undefined) {
                    spells[item.level].push(i);
                }
            }
        }

        // Assign and return
        actorData.gear = gear;
        actorData.spells = spells;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) {
            return;
        }

        // Add Inventory Item
        html.find(".item-create").click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find(".item-edit").click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.getOwnedItem(li.data("itemId"));
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find(".item-delete").click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const liId = li.data("itemId");
            let updates = [];

            // Get item id and container id from actor before deleting
            const item = this.actor.items.find(i => i.data._id === liId);
            const containerId = item.data.data.container;
            if (containerId !== undefined && containerId !== "") {
                // Find the container and filter the items it holds
                const container = this.actor.items.find(i => i.data._id === containerId);
                if (container !== undefined) {
                    let holding = container.data.data.holding.slice();
                    holding = holding.filter(i => i.id !== liId);

                    // Container update
                    updates.push({
                        _id: container.data._id,
                        "data.holding": holding
                    });
                }
            }

            // If item is a container, remove container reference from all items it contains
            let holding = item.data.data.holding;
            if (holding !== undefined) {
                holding.forEach(stored => {
                    updates.push({
                        _id: stored.id,
                        "data.container": ""
                    });
                });
            }

            // Update/Delete Items
            this.actor.updateEmbeddedEntity("OwnedItem", updates);
            this.actor.deleteEmbeddedEntity("OwnedItem", liId);
            li.slideUp(200, () => this.render(false));
        });

        // Remove from container
        html.find(".item-store").click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const liId = li.data("itemId");

            // Get item id and container id from actor
            const item = this.actor.items.find(i => i.data._id === liId);
            const containerId = item.data.data.container;
            if (containerId !== undefined && containerId !== "") {
                // Find the container and filter the items it holds
                const container = this.actor.items.find(i => i.data._id === containerId);
                if (container !== undefined) {
                    let holding = container.data.data.holding.slice();
                    holding = holding.filter(i => i.id !== liId);

                    const updates = [{
                            _id: container.data._id,
                            "data.holding": holding
                        },
                        {
                            _id: item.data._id,
                            "data.container": ""
                        }
                    ];
                    this.actor.updateEmbeddedEntity("OwnedItem", updates);
                }
            }
        });

        // Check Buttons
        html.find(".rollable").click(this._onRollItem.bind(this));

        // Item State Toggling
        html.find(".item-toggle").click(this._onToggleItem.bind(this));

        // Toggle Item Details
        html.find(".item-details-toggle").click(this._showItemDetails.bind(this));

        if (this.actor.owner) {
            let handler = ev => this._onDragItemStart(ev);
            html.find("li.item").each((i, li) => {
                if (li.classList.contains("inventory-header")) {
                    return;
                }
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

    _showItemDetails(event) {
        event.preventDefault();
        const toggler = $(event.currentTarget);
        const item = toggler.parents('.item');
        const description = item.find('.item-description');

        if (toggler.hasClass('description-hidden')) {
            toggler.removeClass('description-hidden').addClass('description-shown');
            description.slideDown();
        } else {
            toggler.removeClass('description-shown').addClass('description-hidden');
            description.slideUp();
        }
    }

    /* -------------------------------------------- */

    /**
     * Handle toggling the state of an Owned Item within the Actor
     * @param {Event} event   The triggering click event
     * @private
     */
    _onToggleItem(event) {
        event.preventDefault();
        const itemId = event.currentTarget.closest(".item").dataset.itemId;
        const item = this.actor.getOwnedItem(itemId);
        const attr = item.data.type === "spell" ? "data.preparation.prepared" : "data.equipped";
        if (item.data.type === "armor" || item.data.type === "shield" || item.data.type === "weapon" || item.data.type === "traveling") {
            const capacity = this.actor.data.data.attributes.capacity;
            const equippedItems = this.actor.items.filter(i => i.data.data.equipped === true);
            const hand1 = equippedItems.filter(i => i.data.data.equip === "1hand").length;
            const hand2 = equippedItems.filter(i => i.data.data.equip === "2hand").length;
            const feet = equippedItems.filter(i => i.data.data.equip === "feet").length;
            const chest = equippedItems.filter(i => i.data.data.equip === "chest").length;
            const head = equippedItems.filter(i => i.data.data.equip === "head").length;
            const face = equippedItems.filter(i => i.data.data.equip === "face").length;
            const back = equippedItems.filter(i => i.data.data.equip === "back").length;
            const staff = equippedItems.filter(i => i.data.data.equip === "staff").length;
            const accessory = equippedItems.filter(i => i.data.data.equip === "accessory").length;
            const traveling = equippedItems.filter(i => i.data.type === "traveling").length;
            const hands = hand2 > 0 ? 2 : hand1;
            const itemHands = item.data.data.equip === "2hand" ? 2 : 1;

            if (!getProperty(item.data, attr) && (Number(capacity.equipped) + Number(item.data.data.size) > capacity.max)) {
                ui.notifications.error(game.i18n.localize("RYUU.toomuch"));
            } else if (!getProperty(item.data, attr) && ((item.data.data.equip === "1hand" || item.data.data.equip === "2hand") && hands + itemHands > RYUU.MAX_HAND)) {
                ui.notifications.error(game.i18n.localize("RYUU.toomuchhands"));
            } else if (!getProperty(item.data, attr) && (item.data.data.equip === "feet" && feet >= RYUU.MAX_FEET)) {
                ui.notifications.error(game.i18n.localize("RYUU.toomuchfeet"));
            } else if (!getProperty(item.data, attr) && (item.data.data.equip === "chest" && chest >= RYUU.MAX_CHEST)) {
                ui.notifications.error(game.i18n.localize("RYUU.toomuchchest"));
            } else if (!getProperty(item.data, attr) && (item.data.data.equip === "head" && head >= RYUU.MAX_HEAD)) {
                ui.notifications.error(game.i18n.localize("RYUU.toomuchhead"));
            } else if (!getProperty(item.data, attr) && (item.data.data.equip === "face" && face >= RYUU.MAX_FACE)) {
                ui.notifications.error(game.i18n.localize("RYUU.toomuchface"));
            } else if (!getProperty(item.data, attr) && (item.data.data.equip === "back" && back >= RYUU.MAX_BACK)) {
                ui.notifications.error(game.i18n.localize("RYUU.toomuchback"));
            } else if (!getProperty(item.data, attr) && (item.data.data.equip === "staff" && staff >= RYUU.MAX_STAFF)) {
                ui.notifications.error(game.i18n.localize("RYUU.toomuchstaff"));
            } else if (!getProperty(item.data, attr) && (item.data.data.equip === "accessory" && accessory >= RYUU.MAX_ACCESSORY)) {
                ui.notifications.error(game.i18n.localize("RYUU.toomuchaccessory"));
            } else if (!getProperty(item.data, attr) && (item.data.type === "traveling" && traveling >= RYUU.MAX_TRAVEL)) {
                ui.notifications.error(game.i18n.localize("RYUU.toomuchtravel"));
            } else {
                return item.update({
                    [attr]: !getProperty(item.data, attr)
                });
            }
        } else {
            return item.update({
                [attr]: !getProperty(item.data, attr)
            });
        }
    }

    /**
     * Handle rolling things on the Character Sheet
     * @param {Event} event   The triggering click event
     * @private
     */
    _onRollItem(event) {
        const actor = this.actor;
        const attr = actor.data.data.attributes;
        const str = Number(attr.str.value);
        const dex = Number(attr.dex.value);
        const int = Number(attr.int.value);
        const spi = Number(attr.spi.value);

        if (event.ctrlKey) {
            concentration();
        } else {
            doRoll(event, false);
        }

        function doRoll(event, isConcentrating, concentrationBonus) {
            let currentTerrain = game.settings.get("ryuutama", "terrain");
            let currentWeather = game.settings.get("ryuutama", "weather");
            let night = game.settings.get("ryuutama", "night");
            let journeyDC = 0;
            let terrainBonus = 0;
            let weatherBonus = 0;
            let journeyBonus = 0;
            let currentModifiers = "";
            let checkText = "";
            const typeMap = actor.data.data.typeMap;

            // To hold all the modifiers a character has + and -
            let modifiers = [];

            const li = $(event.currentTarget).parents(".item");
            const items = actor.items;
            const item = items.find(i => i.id === li.data("itemId"));

            // Get all items with the cursed enchantment. Any equipped cursed items give a condition penalty
            const cursedItems = items.filter(i => i.data.data.enchantments.find(e => e.data.conditionPenalty !== 0) !== undefined && i.data.data.equipped);
            let conditionPenalty = 0;
            cursedItems.forEach(cursed => {
                cursed.data.data.enchantments.forEach(enchantment => {
                    conditionPenalty += enchantment.data.conditionPenalty;
                });
            });

            // Get all armors the actor is wearing and calculate armor penalty
            const armors = items.filter(i => i.data.data.isArmor === true && i.data.data.equipped === true && Object.prototype.hasOwnProperty.call(i.data.data, "penalty") && i.data.data.penalty !== 0);
            let armorPenalty = 0;
            armors.forEach(armor => {
                armorPenalty -= armor.data.data.penalty;
            });

            // Calculate capacity overrage if any and calculate weight penalty
            if (actor.data.type === "character") {
                const maxCapacity = attr.capacity.max;
                const currentCarried = attr.capacity.value;
                let weightPenalty = currentCarried > maxCapacity ? maxCapacity - currentCarried : 0;
                if (weightPenalty !== 0) {
                    modifiers.push(weightPenalty);
                }

                // Calculate the current Journey DC and any bonuses to the current terrain/weather
                if (currentTerrain) {
                    journeyDC += game.settings.get("ryuutama", currentTerrain);
                    let type = typeMap.find(t => t.type + t.number === currentTerrain);
                    terrainBonus = actor.data.data.traveling[type.type][type.index].types[type.type + type.number].bonus;
                    if (actor.data.data.traveling[type.type][type.index].types[type.type + type.number].specialty) {
                        journeyBonus += 2;
                    }
                }
                if (currentWeather) {
                    journeyDC += game.settings.get("ryuutama", currentWeather);
                    let type = typeMap.find(t => t.type + t.number === currentWeather);
                    weatherBonus = actor.data.data.traveling[type.type][type.index].types[type.type + type.number].bonus;
                    if (actor.data.data.traveling[type.type][type.index].types[type.type + type.number].specialty) {
                        journeyBonus += 2;
                    }
                }
                if (night) {
                    journeyDC++;
                }

                // Search for any bonuses to condition and journey checks from class features
                const classes = items.filter(i => i.type === "class");
                classes.forEach(c => {
                    c.data.data.features.forEach(feature => {
                        conditionPenalty += feature.data.condition;
                        journeyBonus += feature.data.journey;
                    });
                });

                // create a message that outputs all the modifiers on the actors rolls

                if (modifiers.length > 0) {
                    currentModifiers = `<br />${actor.name} ${game.i18n.localize("RYUU.checkmodifiers")}:`;
                    modifiers.forEach(element => {
                        currentModifiers += ` ${element},`;
                    });
                    currentModifiers = currentModifiers.replace(/,\s*$/, "");
                }
            }
            switch (event.target.id) {

                // Journey checks
                case "roll-travel": {
                    if (journeyBonus > 0) {
                        modifiers.push(journeyBonus);
                    }
                    if (terrainBonus > 0) {
                        modifiers.push(terrainBonus);
                    }
                    if (weatherBonus > 0) {
                        modifiers.push(weatherBonus);
                    }
                    if (armorPenalty !== 0) {
                        modifiers.push(armorPenalty);
                    }
                    checkText = `${actor.name} ${game.i18n.localize("RYUU.checktravel")} [STR + DEX]`;
                    if (isConcentrating) {
                        modifiers.push(concentrationBonus);
                        checkText = `${actor.name} ${game.i18n.localize("RYUU.checktravel")} [STR + DEX]<br /><strong>CONCENTRATING</strong>`;
                    }
                    const travelCheck = rollCheck(`1d${str} + 1d${dex}`, checkText, modifiers, journeyDC);
                    if (travelCheck.crit) {
                        const pcCondition = actor.data.data.attributes.condition.value || 0;
                        actor.update({
                            "data.attributes.condition.value": pcCondition + 1
                        });
                    } else if (travelCheck.fumble) {
                        const pcHP = actor.data.data.hp.value || 0;
                        actor.update({
                            "data.hp.value": Math.floor(pcHP / 4)
                        });
                    }
                    break;
                }

                case "roll-direction": {
                    if (journeyBonus > 0) {
                        modifiers.push(journeyBonus);
                    }
                    if (terrainBonus > 0) {
                        modifiers.push(terrainBonus);
                    }
                    if (weatherBonus > 0) {
                        modifiers.push(weatherBonus);
                    }
                    if (armorPenalty !== 0) {
                        modifiers.push(armorPenalty);
                    }
                    checkText = `${actor.name} ${game.i18n.localize("RYUU.checkdirection")} [INT + INT]`;
                    if (isConcentrating) {
                        modifiers.push(concentrationBonus);
                        checkText = `${actor.name} ${game.i18n.localize("RYUU.checkdirection")} [INT + INT]<br /><strong>CONCENTRATING</strong>`;
                    }
                    rollCheck(`1d${int} + 1d${int}`, checkText, modifiers, journeyDC);
                    break;
                }

                case "roll-camp": {
                    if (journeyBonus > 0) {
                        modifiers.push(journeyBonus);
                    }
                    if (terrainBonus > 0) {
                        modifiers.push(terrainBonus);
                    }
                    if (weatherBonus > 0) {
                        modifiers.push(weatherBonus);
                    }
                    if (armorPenalty !== 0) {
                        modifiers.push(armorPenalty);
                    }
                    checkText = `${actor.name} ${game.i18n.localize("RYUU.checkcamp")} [DEX + INT]`;
                    if (isConcentrating) {
                        modifiers.push(concentrationBonus);
                        checkText = `${actor.name} ${game.i18n.localize("RYUU.checkcamp")} [DEX + INT]<br /><strong>CONCENTRATING</strong>`;
                    }
                    rollCheck(`1d${dex} + 1d${int}`, checkText, modifiers, journeyDC);
                    break;
                }

                // Condition Check
                case "roll-condition": {
                    if (conditionPenalty !== 0) {
                        modifiers.push(conditionPenalty);
                    }
                    if (armorPenalty !== 0) {
                        modifiers.push(armorPenalty);
                    }
                    checkText = `${actor.name} ${game.i18n.localize("RYUU.checkcondition")} [STR + SPI]`;
                    if (isConcentrating) {
                        modifiers.push(concentrationBonus);
                        checkText = `${actor.name} ${game.i18n.localize("RYUU.checkcondition")} [STR + SPI]<br /><strong>CONCENTRATING</strong>`;
                    }
                    const condition = rollCheck(`1d${str} + 1d${spi}`, checkText, modifiers);
                    const effects = actor.data.data.effects;
                    for (const name in effects) {
                        if (Object.prototype.hasOwnProperty.call(effects, name) && condition.roll >= effects[name]) {
                            let attr = `data.data.effects.${name}`;
                            actor.update({
                                [attr]: 0
                            });
                        }
                    }
                    actor.update({
                        "data.attributes.condition.value": condition.roll
                    });
                    break;
                }

                // Initative roll
                case "roll-initiative": {
                    if (armorPenalty !== 0) {
                        modifiers.push(armorPenalty);
                    }
                    checkText = `${actor.name} ${game.i18n.localize("RYUU.checkinitiative")} [DEX + INT]`;
                    if (isConcentrating) {
                        modifiers.push(concentrationBonus);
                        checkText = `${actor.name} ${game.i18n.localize("RYUU.checkinitiative")} [DEX + INT]<br /><strong>CONCENTRATING</strong>`;
                    }
                    const initiative = rollCheck(`1d${dex} + 1d${int}`, checkText, modifiers);
                    actor.update({
                        "data.attributes.initiative": initiative.roll
                    });
                    break;
                }

                // Single Stat rolls
                case "roll-strength": {
                    if (event.altKey) {
                        rollCheck(`1d${str}`, `${actor.name} ${game.i18n.localize("RYUU.checkstr")} [STR]${currentModifiers}`);
                    } else {
                        checkText = `${actor.name} ${game.i18n.localize("RYUU.checkstr")} [STR + STR]`;
                        if (isConcentrating) {
                            modifiers.push(concentrationBonus);
                            checkText = `${actor.name} ${game.i18n.localize("RYUU.checkstr")} [STR + STR]<br /><strong>CONCENTRATING</strong>`;
                        }
                        rollCheck(`2d${str}`, `${checkText}${currentModifiers}`, modifiers);
                    }
                    break;
                }

                case "roll-dexterity": {
                    if (event.altKey) {
                        rollCheck(`1d${dex}`, `${actor.name} ${game.i18n.localize("RYUU.checkdex")} [DEX]${currentModifiers}`);
                    } else {
                        checkText = `${actor.name} ${game.i18n.localize("RYUU.checkdex")} [DEX + DEX]`;
                        if (isConcentrating) {
                            modifiers.push(concentrationBonus);
                            checkText = `${actor.name} ${game.i18n.localize("RYUU.checkdex")} [DEX + DEX]<br /><strong>CONCENTRATING</strong>`;
                        }
                        rollCheck(`2d${dex}`, `${checkText}${currentModifiers}`, modifiers);
                    }
                    break;
                }

                case "roll-intelligence": {
                    if (event.altKey) {
                        rollCheck(`1d${int}`, `${actor.name} ${game.i18n.localize("RYUU.checkint")} [INT]${currentModifiers}`);
                    } else {
                        checkText = `${actor.name} ${game.i18n.localize("RYUU.checkint")} [INT + INT]`;
                        if (isConcentrating) {
                            modifiers.push(concentrationBonus);
                            checkText = `${actor.name} ${game.i18n.localize("RYUU.checkint")} [INT + INT]<br /><strong>CONCENTRATING</strong>`;
                        }
                        rollCheck(`2d${int}`, `${checkText}${currentModifiers}`, modifiers);
                    }
                    break;
                }

                case "roll-spirit": {
                    if (event.altKey) {
                        rollCheck(`1d${spi}`, `${actor.name} ${game.i18n.localize("RYUU.checkspi")} [SPI]${currentModifiers}`);
                    } else {
                        checkText = `${actor.name} ${game.i18n.localize("RYUU.checkspi")} [SPI + SPI]`;
                        if (isConcentrating) {
                            modifiers.push(concentrationBonus);
                            checkText = `${actor.name} ${game.i18n.localize("RYUU.checkspi")} [SPI + SPI]<br /><strong>CONCENTRATING</strong>`;
                        }
                        rollCheck(`2d${spi}`, `${checkText}${currentModifiers}`, modifiers);
                    }
                    break;
                }

                case "set-max-hp": {
                    // Set HP to full
                    actor.update({
                        "data.hp.value": actor.data.data.hp.max
                    });
                    break;
                }

                case "set-max-mp": {
                    // Set MP to full
                    actor.update({
                        "data.mp.value": actor.data.data.mp.max
                    });
                    break;
                }

                case "use-fumble": {
                    // Remvoe a fumble point
                    const pcFumble = actor.data.data.attributes.fumble || 0;
                    if (pcFumble > 0) {
                        actor.update({
                            "data.attributes.fumble": pcFumble - 1
                        });
                        ChatMessage.create({
                            content: `${actor.name} uses a <strong>fumble point</strong>`
                        }, {});
                    }
                    break;
                }

                case "roll-accuracy": {
                    checkText = `${actor.name} attacks!`;
                    if (isConcentrating) {
                        modifiers.push(concentrationBonus);
                        checkText = `${actor.name} attacks!<br /><strong>CONCENTRATING</strong>`;
                    }
                    rollCheck(actor.data.data.accuracy, checkText, modifiers);
                    break;
                }

                case "roll-damage": {
                    rollCheck(actor.data.data.damage, `${actor.name} damage:`, modifiers);
                    break;
                }

                case "roll-ability-accuracy": {
                    let abilityText = `${actor.name} uses their <strong>Special Ability</strong>:<p>${actor.data.data.ability.description}</p>`;
                    if (actor.data.data.ability.accuracy) {
                        checkText = abilityText;
                        if (isConcentrating) {
                            modifiers.push(concentrationBonus);
                            checkText = `${abilityText}<br /><strong>CONCENTRATING</strong>`;
                        }
                        rollCheck(actor.data.data.ability.accuracy, checkText, modifiers);
                    } else {
                        ChatMessage.create({
                            content: abilityText
                        }, {});
                    }
                    break;
                }

                case "roll-ability-damage": {
                    rollCheck(actor.data.data.ability.damage, `${actor.name}'s <strong>Special Ability</strong> damage:`);
                    break;
                }

                default: {
                    // Handle all other roll types
                    if (item) {
                        switch (item.data.type) {
                            case "weapon": {
                                let accuracy = item.data.data.accuracy.replace(/(\[|)STR(\]|)/g, "1d@str").replace(/(\[|)DEX(\]|)/g, "1d@dex").replace(/(\[|)INT(\]|)/g, "1d@int").replace(/(\[|)SPI(\]|)/g, "1d@spi");
                                let damage = item.data.data.damage.replace(/(\[|)STR(\]|)/g, "1d@str").replace(/(\[|)DEX(\]|)/g, "1d@dex").replace(/(\[|)INT(\]|)/g, "1d@int").replace(/(\[|)SPI(\]|)/g, "1d@spi");
                                let accuracyRoll;
                                if (event.currentTarget.classList.contains("accuracy")) {
                                    if ((!event.altKey && !event.shiftKey) || (!event.altKey && event.shiftKey)) {
                                        checkText = `${actor.name} attacks with their <strong>${item.name}</strong>`;
                                        if (isConcentrating) {
                                            modifiers.push(concentrationBonus);
                                            checkText = `${actor.name} attacks with their <strong>${item.name}</strong><br /><strong>CONCENTRATING</strong>`;
                                        }
                                        accuracyRoll = rollCheck(`${accuracy} + ${item.data.data.masteredBonus}`, `${checkText}${currentModifiers}`, modifiers);
                                    }
                                }
                                if (event.currentTarget.classList.contains("damage")) {
                                    if ((event.altKey && event.shiftKey) || (!event.altKey && !event.shiftKey && accuracyRoll !== undefined && accuracyRoll.crit)) {
                                        damage = damage += ` + ${damage}`;
                                        rollCheck(`${damage} + ${item.data.data.damageBonus}`, `<strong>${item.name}</strong> CRITICAL damage:`);
                                    } else if ((event.altKey && !event.shiftKey) || (!event.altKey && !event.shiftKey && !(accuracyRoll !== undefined && accuracyRoll.fumble))) {
                                        rollCheck(`${damage} + ${item.data.data.damageBonus}`, `<strong>${item.name}</strong> damage:`);
                                    }
                                }
                                break;
                            }

                            case "spell": {
                                const mpRemaining = actor.data.data.mp.value;
                                const cost = item.data.data.cost;
                                if (cost > mpRemaining) {
                                    ui.notifications.error(`${this.name} does not have enough MP remaining!`);
                                } else {
                                    actor.update({
                                        "data.mp.value": mpRemaining - cost
                                    });
                                    checkText = `${actor.name} casts <strong>${item.name}</strong> [INT + SPI]`;
                                    if (isConcentrating) {
                                        modifiers.push(concentrationBonus);
                                        checkText = `${actor.name} casts <strong>${item.name}</strong> [INT + SPI]<br /><strong>CONCENTRATING</strong>`;
                                    }
                                    rollCheck("1d@int + 1d@spi", `${checkText}<br />${item.data.data.description || ""}<strong>Duration</strong>: ${item.data.data.duration}<br /><strong>Target</strong>: ${item.data.data.target}<br /><strong>Range</strong>: ${item.data.data.range}${currentModifiers}`, modifiers);
                                }
                                console.log(item);
                                break;
                            }

                            default:
                                break;
                        }
                    } else {
                        let text = "";
                        if (event.target.previousSibling.previousSibling.innerText) {
                            text = `${actor.name} ${game.i18n.localize("RYUU.check")} <strong>${event.target.previousSibling.previousSibling.innerText}</strong> ${event.target.innerText}`;
                        }
                        rollCheck(event.target.innerText.replace(/(\[|)STR(\]|)/g, "1d@str").replace(/(\[|)DEX(\]|)/g, "1d@dex").replace(/(\[|)INT(\]|)/g, "1d@int").replace(/(\[|)SPI(\]|)/g, "1d@spi"), text + currentModifiers, modifiers);
                    }
                    break;
                }
            }
        }

        function concentration() {
            let isConcentrating = false;
            let concentrationBonus = 0;
            let choice = "cancel";
            let buttons = {
                mp: {
                    label: "Use MP",
                    callback: () => choice = "mp"
                }
            };
            if (actor.data.data.attributes.fumble > 0) {
                buttons.fumble = {
                    label: "Use Fumble",
                    callback: () => choice = "fumble"
                };
                buttons.both = {
                    label: "Use Both",
                    callback: () => choice = "both"
                };
            }
            buttons.cancel = {
                label: "Normal Roll"
            };

            new Dialog({
                title: "Concentration",
                content: "Make this check while concentrating?<br />",
                buttons: buttons,
                default: "cancel",
                close: () => {
                    switch (choice) {
                        case "mp": {
                            isConcentrating = true;
                            concentrationBonus = 1;
                            actor.update({
                                "data.mp.value": actor.data.data.mp.value - Math.ceil(actor.data.data.mp.value / 2)
                            });
                            break;
                        }
                        case "fumble": {
                            isConcentrating = true;
                            concentrationBonus = 1;
                            actor.update({
                                "data.attributes.fumble": actor.data.data.attributes.fumble - 1
                            });
                            break;
                        }
                        case "both": {
                            isConcentrating = true;
                            concentrationBonus = 2;
                            actor.update({
                                "data.mp.value": actor.data.data.mp.value - Math.ceil(actor.data.data.mp.value / 2),
                                "data.attributes.fumble": actor.data.data.attributes.fumble - 1
                            });
                            break;
                        }

                        default:
                            break;
                    }
                    doRoll(event, isConcentrating, concentrationBonus);
                }
            }).render(true);
        }

        function rollCheck(formula, flavor, modifiers, journeyDC) {
            if (modifiers !== undefined && modifiers.length > 0) {
                modifiers.forEach(mod => {
                    formula += ` + ${mod}`;
                });
            }
            const r = new Roll(formula, {
                str: str,
                dex: dex,
                int: int,
                spi: spi
            });
            const roll = r.roll();
            const dice = roll.dice;
            const smallDice = dice.filter(r => r.faces < 6);
            const maxRolls = dice.filter(r => r.rolls[0].roll === r.faces);
            const largeCrits = dice.filter(r => r.rolls[0].roll === r.faces || r.rolls[0].roll === 6);
            const fumbleRolls = dice.filter(r => r.rolls[0].roll === 1);
            let crit = false;
            let fumble = false;
            if (dice.length > 1 && ((smallDice !== undefined && maxRolls.length === dice.length) || (largeCrits.length === dice.length))) {
                crit = true;
                flavor += game.i18n.localize("RYUU.rollcrit");
            }
            if (dice.length > 1 && fumbleRolls.length === dice.length) {
                fumble = true;
                flavor += game.i18n.localize("RYUU.rollfumble");
                const players = game.actors.filter(a => a.isPC);
                players.forEach(player => {
                    const pcFumble = player.data.data.attributes.fumble || 0;
                    player.update({
                        "data.attributes.fumble": pcFumble + 1
                    });
                });
            }
            if (journeyDC !== undefined && roll._total >= journeyDC && !fumble) {
                flavor += game.i18n.localize("RYUU.journeypass") + journeyDC;
            } else if ((journeyDC !== undefined && roll._total < journeyDC) || fumble) {
                flavor += game.i18n.localize("RYUU.journeyfail") + journeyDC;
            }
            roll.toMessage({
                flavor: flavor
            });
            return {
                roll: roll._total,
                crit: crit,
                fumble: fumble,
            };
        }
    }

    /* -------------------------------------------- */

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data
        };
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data["type"];

        // Finally, create the item!
        return this.actor.createEmbeddedEntity("OwnedItem", itemData);
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
    _updateObject(event, formData) {
        // Update the Actor
        return this.object.update(formData);
    }

    /* -------------------------------------------- */

    /** @override */
    async modifyTokenAttribute(attribute, value, isDelta, isBar) {
        if (attribute === "hp") {
            // Get current and delta HP
            const hp = getProperty(this.data.data, attribute);
            const current = hp.value;
            const max = hp.max;
            const delta = isDelta ? value : value - current;

            return this.update({
                "data.hp.value": Math.clamped(hp.value + delta, 0, max)
            });
        } else if (attribute === "mp") {
            // Get current and delta MP
            const mp = getProperty(this.data.data, attribute);
            const current = mp.value;
            const max = mp.max;
            const delta = isDelta ? value : value - current;

            return this.update({
                "data.mp.value": Math.clamped(mp.value + delta, 0, max)
            });
        } else {
            return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
        }
    }
}
