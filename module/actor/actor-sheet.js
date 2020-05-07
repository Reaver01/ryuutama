import {
    RYUU
} from '../config.js';

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
                initial: "equipment"
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
        if (this.actor.data.type == 'character') {
            this._prepareCharacterItems(data);
        }

        return data;
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
            if (i.type === "item") {
                gear.push(i);
            }
            // Append to equipment.
            if (i.type === "weapon" || i.type === "armor" || i.type === "shield" || i.type === "traveling") {
                equipment.push(i);
            }
            // Append to container.
            if (i.type === "container") {
                containers.push(i);
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
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Item summaries
        html.find('.item .item-name h4').click(event => this._onItemSummary(event));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.getOwnedItem(li.data("itemId"));
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            this.actor.deleteOwnedItem(li.data("itemId"));
            li.slideUp(200, () => this.render(false));
        });

        // Check Buttons
        html.find('.rollable').click(this._onRollItem.bind(this));

        // Item State Toggling
        html.find('.item-toggle').click(this._onToggleItem.bind(this));
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
        let str = Number(actor.data.data.attributes.str.value);
        let dex = Number(actor.data.data.attributes.dex.value);
        let int = Number(actor.data.data.attributes.int.value);
        let spi = Number(actor.data.data.attributes.spi.value);
        let modifiers = [];

        // Attribute bonuses
        if (actor.data.data.attributes.str.bonus && str < 12) {
            str = RYUU.DICE[RYUU.DICE.findIndex(i => i === str) + 1];
        }
        if (actor.data.data.attributes.dex.bonus && dex < 12) {
            dex = RYUU.DICE[RYUU.DICE.findIndex(i => i === dex) + 1];
        }
        if (actor.data.data.attributes.int.bonus && int < 12) {
            int = RYUU.DICE[RYUU.DICE.findIndex(i => i === int) + 1];
        }
        if (actor.data.data.attributes.spi.bonus && spi < 12) {
            int = RYUU.DICE[RYUU.DICE.findIndex(i => i === spi) + 1];
        }

        // Status effect decreases
        if (actor.data.data.effects.injury > 0 && dex > 4) {
            dex = RYUU.DICE[RYUU.DICE.findIndex(i => i === dex) - 1];
        }
        if (actor.data.data.effects.poison > 0 && str > 4) {
            str = RYUU.DICE[RYUU.DICE.findIndex(i => i === str) - 1];
        }
        if (actor.data.data.effects.sickness > 0) {
            if (dex > 4) {
                dex = RYUU.DICE[RYUU.DICE.findIndex(i => i === dex) - 1];
            }
            if (str > 4) {
                str = RYUU.DICE[RYUU.DICE.findIndex(i => i === str) - 1];
            }
            if (spi > 4) {
                spi = RYUU.DICE[RYUU.DICE.findIndex(i => i === spi) - 1];
            }
            if (int > 4) {
                int = RYUU.DICE[RYUU.DICE.findIndex(i => i === int) - 1];
            }
        }
        if (actor.data.data.effects.exhaustion > 0 && spi > 4) {
            spi = RYUU.DICE[RYUU.DICE.findIndex(i => i === spi) - 1];
        }
        if (actor.data.data.effects.muddled > 0 && int > 4) {
            int = RYUU.DICE[RYUU.DICE.findIndex(i => i === int) - 1];
        }
        if (actor.data.data.effects.shock > 0) {
            if (dex > 4) {
                dex = RYUU.DICE[RYUU.DICE.findIndex(i => i === dex) - 1];
            }
            if (str > 4) {
                str = RYUU.DICE[RYUU.DICE.findIndex(i => i === str) - 1];
            }
            if (spi > 4) {
                spi = RYUU.DICE[RYUU.DICE.findIndex(i => i === spi) - 1];
            }
            if (int > 4) {
                int = RYUU.DICE[RYUU.DICE.findIndex(i => i === int) - 1];
            }
        }

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
        const maxCapacity = actor.data.data.attributes.capacity.max;
        const currentCarried = actor.data.data.attributes.capacity.value;
        let weightPenalty = currentCarried > maxCapacity ? maxCapacity - currentCarried : 0;
        const hpUp = actor.data.data.attributes.statIncreases.hp;
        const mpUp = actor.data.data.attributes.statIncreases.mp;
        const upEarned = actor.data.data.attributes.statIncreases.earned;
        if (weightPenalty !== 0) {
            modifiers.push(weightPenalty);
        }
        if (item !== undefined) {
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
            currentModifiers = `\n${actor.name} ${game.i18n.localize("RYUU.check.modifiers")}:`;
            modifiers.forEach(element => {
                currentModifiers += ` ${element},`;
            });
            currentModifiers.slice(0, -1);
        }

        switch (event.target.id) {
            case "roll-travel":
                rollCheck(`1d${str} + 1d${dex}`, `${actor.name} ${game.i18n.localize("RYUU.check.travel")} [STR] + [DEX]`, modifiers);
                break;
            case "roll-direction":
                rollCheck(`1d${int} + 1d${int}`, `${actor.name} ${game.i18n.localize("RYUU.check.direction")} [INT] + [INT]`, modifiers);
                break;
            case "roll-camp":
                rollCheck(`1d${dex} + 1d${int}`, `${actor.name} ${game.i18n.localize("RYUU.check.camp")} [DEX] + [INT]`, modifiers);
                break;
            case "roll-condition":
                if (conditionPenalty !== 0) {
                    modifiers.push(conditionPenalty);
                }
                const condition = rollCheck(`1d${str} + 1d${spi}`, `${actor.name} ${game.i18n.localize("RYUU.check.condition")} [STR] + [SPI]`, modifiers);
                const effects = actor.data.data.effects;
                for (const name in effects) {
                    if (effects.hasOwnProperty(name) && condition.roll >= effects[name]) {
                        let attr = `data.effects.${name}`;
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
                    "data.attributes.initiative.value": initiative.roll
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
                if (event.shiftKey && hpUp + mpUp < upEarned) {
                    actor.update({
                        "data.attributes.statIncreases.hp": hpUp + 1
                    });
                } else if (event.altKey) {
                    actor.update({
                        "data.attributes.statIncreases.hp": hpUp - 1
                    });
                } else {
                    actor.update({
                        "data.hp.value": actor.data.data.hp.max
                    });
                }
                break;
            case "set-max-mp":
                if (event.shiftKey && hpUp + mpUp < upEarned) {
                    actor.update({
                        "data.attributes.statIncreases.mp": mpUp + 1
                    });
                } else if (event.altKey) {
                    actor.update({
                        "data.attributes.statIncreases.mp": mpUp - 1
                    });
                } else {
                    actor.update({
                        "data.mp.value": actor.data.data.mp.max
                    });
                }
                break;
            default:
                break;
        }

        function rollCheck(formula, flavor, modifiers) {
            console.log(formula);
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
        return this.actor.createOwnedItem(itemData);
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

    /**
     * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
     * @private
     */
    _onItemSummary(event) {
        event.preventDefault();
        console.log(event);
        let li = $(event.currentTarget).parents(".item"),
            item = this.actor.getOwnedItem(li.data("item-id"));
        //chatData = item.getChatData({
        //    secrets: this.actor.owner
        //});

        // Toggle summary
        if (li.hasClass("expanded")) {
            let summary = li.children(".item-summary");
            summary.slideUp(200, () => summary.remove());
        } else {
            let div = $(`<div class="item-summary">${item.data.data.description}</div>`);
            let props = $(`<div class="item-properties"></div>`);
            //chatData.properties.forEach(p => props.append(`<span class="tag">${p}</span>`));
            div.append(props);
            li.append(div.hide());
            div.slideDown(200);
        }
        li.toggleClass("expanded");
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