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
            height: 650,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "items"
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
        if (this.actor.data.type == "character") {
            this._prepareCharacterItems(data);
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
                        if (!item || item.data.data.container === container.id) return;
                        if (item.type !== "enchantment" && item.data.type !== "animal" && (container.type === "container" || container.type === "animal") && item.data._id !== container.id) {

                            // Check if container is inside a container
                            if (container.data.data.container !== undefined && container.data.data.container !== "") return;

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
                                                equippable: (i.data.type === "weapon" || i.data.type === "armor" || i.data.type === "shield" || i.data.type === "traveling"),
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
                            if (found !== undefined || container.data.data.holdingSize + item.data.data.size > container.data.data.canHold) return;

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
                                equippable: (item.data.type === "weapon" || item.data.type === "armor" || item.data.type === "shield" || item.data.type === "traveling"),
                                equip: item.data.data.equip,
                                img: item.img,
                                size: item.data.data.size
                            });
                            updates.push({
                                _id: container.id,
                                "data.holding": holding
                            })

                            await actor.updateEmbeddedEntity("OwnedItem", updates);
                        }
                    } else {
                        // Remove item from container if it's dropped somewhere else outside the container
                        const actor = game.actors.get(data.actorId);
                        const item = actor.items.find(i => i.data._id === data.data._id);
                        if (!item) return
                        const container = actor.items.find(i => i.data._id === item.data.data.container);
                        if (!container) return;
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
                    if (!item) return
                    const container = actor.items.find(i => i.data._id === item.data.data.container);
                    if (!container) return;
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
        const features = [];
        const spells = {
            0: [],
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: [],
            7: [],
            8: [],
            9: []
        };

        // Iterate through items, allocating to containers
        // let totalWeight = 0;
        for (let i of sheetData.items) {
            let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type === "item" && (i.data.container === undefined || i.data.container === "")) {
                gear.push(i);
            }
            // Append to equipment.
            if ((i.type === "weapon" || i.type === "armor" || i.type === "shield" || i.type === "traveling") && (i.data.container === undefined || i.data.container === "")) {
                equipment.push(i);
            }
            // Append to container.
            if (i.type === "container" && (i.data.container === undefined || i.data.container === "")) {
                containers.push(i);
            }
            // Append to container.
            if (i.type === "animal") {
                animals.push(i);
            }
            // Append to features.
            else if (i.type === "feature") {
                features.push(i);
            }
            // Append to spells.
            else if (i.type === "spell") {
                if (i.data.spellLevel != undefined) {
                    spells[i.data.spellLevel].push(i);
                }
            }
        }

        // Assign and return
        actorData.gear = gear;
        actorData.equipment = equipment;
        actorData.containers = containers;
        actorData.animals = animals;
        actorData.features = features;
        actorData.spells = spells;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

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

        if (this.actor.owner) {
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
            const hands = hand2 > 0 ? 2 : hand1
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
        let str = Number(attr.str.value);
        let dex = Number(attr.dex.value);
        let int = Number(attr.int.value);
        let spi = Number(attr.spi.value);
        let modifiers = [];

        const li = $(event.currentTarget).parents(".item");
        const items = this.actor.items
        const item = items.find(i => i.id === li.data("itemId"));
        const cursedItems = items.filter(i => i.data.data.enchantments.find(e => e.data.conditionPenalty !== 0) !== undefined && i.data.data.equipped);
        let conditionPenalty = 0;
        cursedItems.forEach(cursed => {
            cursed.data.data.enchantments.forEach(enchantment => {
                conditionPenalty += enchantment.data.conditionPenalty;
            });
        });
        const maxCapacity = attr.capacity.max;
        const currentCarried = attr.capacity.value;
        let weightPenalty = currentCarried > maxCapacity ? maxCapacity - currentCarried : 0;
        const journeyDC = RYUU.TERRAIN[actor.data.data.current.terrain] + RYUU.WEATHER[actor.data.data.current.weather];
        const terrainBonus = actor.data.data.traveling[actor.data.data.current.terrain];
        const weatherBonus = actor.data.data.traveling[actor.data.data.current.weather];
        let journeyBonus = 0;
        if (actor.data.data.specialty[actor.data.data.current.terrain]) {
            journeyBonus += 2;
        }
        if (actor.data.data.specialty[actor.data.data.current.weather]) {
            journeyBonus += 2;
        }
        if (weightPenalty !== 0) {
            modifiers.push(weightPenalty);
        }
        if (item) {
            switch (item.data.type) {
                case "weapon":
                    let accuracy = item.data.data.accuracy.replace("[STR]", "1d@str").replace("[DEX]", "1d@dex").replace("[INT]", "1d@int").replace("[SPI]", "1d@spi");
                    let damage = item.data.data.damage.replace("[STR]", "1d@str").replace("[DEX]", "1d@dex").replace("[INT]", "1d@int").replace("[SPI]", "1d@spi");
                    let accuracyRoll;
                    if (event.currentTarget.classList.contains("accuracy")) {
                        if ((!event.altKey && !event.shiftKey) || (!event.altKey && event.shiftKey)) {
                            accuracyRoll = rollCheck(`${accuracy} + ${item.data.data.accuracyBonus}`, `${actor.name} attacks with their ${item.name}`, modifiers)
                        }
                    }
                    if (event.currentTarget.classList.contains("damage")) {
                        if ((event.altKey && event.shiftKey) || (!event.altKey && !event.shiftKey && accuracyRoll !== undefined && accuracyRoll.crit)) {
                            damage = damage += ` + ${damage}`;
                            rollCheck(`${damage} + ${item.data.data.damageBonus}`, `${item.name} CRITICAL damage:`);
                        } else if ((event.altKey && !event.shiftKey) || (!event.altKey && !event.shiftKey && !(accuracyRoll !== undefined && accuracyRoll.fumble))) {
                            rollCheck(`${damage} + ${item.data.data.damageBonus}`, `${item.name} damage:`);
                        }
                    }
                    break;

                default:
                    break;
            }
        }
        let currentModifiers = "";
        if (modifiers.length > 0) {
            currentModifiers = `<br />${actor.name} ${game.i18n.localize("RYUU.check.modifiers")}:`;
            modifiers.forEach(element => {
                currentModifiers += ` ${element},`;
            });
            currentModifiers.slice(0, -1);
        }
        switch (event.target.id) {
            case "roll-travel":
                if (journeyBonus > 0) {
                    modifiers.push(journeyBonus);
                }
                if (terrainBonus > 0) {
                    modifiers.push(terrainBonus);
                }
                if (weatherBonus > 0) {
                    modifiers.push(weatherBonus);
                }
                rollCheck(`1d${str} + 1d${dex}`, `${actor.name} ${game.i18n.localize("RYUU.check.travel")} [STR] + [DEX]`, modifiers, journeyDC);
                break;
            case "roll-direction":
                if (journeyBonus > 0) {
                    modifiers.push(journeyBonus);
                }
                if (terrainBonus > 0) {
                    modifiers.push(terrainBonus);
                }
                if (weatherBonus > 0) {
                    modifiers.push(weatherBonus);
                }
                rollCheck(`1d${int} + 1d${int}`, `${actor.name} ${game.i18n.localize("RYUU.check.direction")} [INT] + [INT]`, modifiers, journeyDC);
                break;
            case "roll-camp":
                if (journeyBonus > 0) {
                    modifiers.push(journeyBonus);
                }
                if (terrainBonus > 0) {
                    modifiers.push(terrainBonus);
                }
                if (weatherBonus > 0) {
                    modifiers.push(weatherBonus);
                }
                rollCheck(`1d${dex} + 1d${int}`, `${actor.name} ${game.i18n.localize("RYUU.check.camp")} [DEX] + [INT]`, modifiers, journeyDC);
                break;
            case "roll-condition":
                if (conditionPenalty !== 0) {
                    modifiers.push(conditionPenalty);
                }
                const condition = rollCheck(`1d${str} + 1d${spi}`, `${actor.name} ${game.i18n.localize("RYUU.check.condition")} [STR] + [SPI]`, modifiers);
                const effects = actor.data.data.effects;
                for (const name in effects) {
                    if (effects.hasOwnProperty(name) && condition.roll >= effects[name]) {
                        let attr = `data.data.effects.${name}`;
                        actor.update({
                            [attr]: 0
                        });
                    }
                }
                actor.update({
                    "data.attributes.condition.value": condition.roll
                })
                break;
            case "roll-initiative":
                const initiative = rollCheck(`1d${dex} + 1d${int}`, `${actor.name} ${game.i18n.localize("RYUU.check.initiative")} [DEX] + [INT]`, modifiers);
                actor.update({
                    "data.attributes.initiative": initiative.roll
                })
                break;
            case "roll-strength":
                rollCheck(`1d${str}`, `${actor.name} ${game.i18n.localize("RYUU.check.str")} [STR]${currentModifiers}`);
                break;
            case "roll-dexterity":
                rollCheck(`1d${dex}`, `${actor.name} ${game.i18n.localize("RYUU.check.dex")} [DEX]${currentModifiers}`);
                break;
            case "roll-intelligence":
                rollCheck(`1d${int}`, `${actor.name} ${game.i18n.localize("RYUU.check.int")} [INT]${currentModifiers}`);
                break;
            case "roll-spirit":
                rollCheck(`1d${spi}`, `${actor.name} ${game.i18n.localize("RYUU.check.spi")} [SPI]${currentModifiers}`);
                break;
            case "set-max-hp":
                actor.update({
                    "data.hp.value": actor.data.data.hp.max
                });
                break;
            case "set-max-mp":

                actor.update({
                    "data.mp.value": actor.data.data.mp.max
                });
                break;
            default:
                break;
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
            }
            if (journeyDC !== undefined && roll._total >= journeyDC) {
                flavor += game.i18n.localize("RYUU.journeypass") + journeyDC;
            } else if (journeyDC !== undefined && roll._total < journeyDC) {
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