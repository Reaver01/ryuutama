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
            height: 600,
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
        data.dtypes = ["String", "Number", "Boolean"];
        for (let attr of Object.values(data.data.attributes)) {
            attr.isCheckbox = attr.dtype === "Boolean";
        }
        // Prepare items.
        if (this.actor.data.type == 'character') {
            this._prepareCharacterItems(data);
        }

        return data;
    }
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
            if (i.type === 'item' || i.type === 'weapon' || i.type === 'armor' || i.type === 'shield' || i.type === 'traveling') {
                gear.push(i);
            }
            // Append to features.
            else if (i.type === 'feature') {
                features.push(i);
            }
            // Append to spells.
            else if (i.type === 'spell') {
                if (i.data.spellLevel != undefined) {
                    spells[i.data.spellLevel].push(i);
                }
            }
        }

        // Assign and return
        actorData.gear = gear;
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
    }

    /* -------------------------------------------- */


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
        if (actor.data.data.attributes.str.bonus) {
            str = RYUU.DICE[RYUU.DICE.findIndex(i => i === str) + 1];
        }
        if (actor.data.data.attributes.dex.bonus) {
            dex = RYUU.DICE[RYUU.DICE.findIndex(i => i === dex) + 1];
        }
        if (actor.data.data.attributes.int.bonus) {
            int = RYUU.DICE[RYUU.DICE.findIndex(i => i === int) + 1];
            console.log(RYUU.DICE.findIndex(i => i === int));
        }
        if (actor.data.data.attributes.spi.bonus) {
            int = RYUU.DICE[RYUU.DICE.findIndex(i => i === spi) + 1];
        }
        const li = $(event.currentTarget).parents(".item");
        const item = this.actor.items.find(i => i.id === li.data("itemId"));
        if (item !== undefined) {
            switch (item.data.type) {
                case "weapon":
                    let accuracy = item.data.data.accuracy.replace("[STR]", "1d@str").replace("[DEX]", "1d@dex").replace("[INT]", "1d@int").replace("[SPI]", "1d@spi");
                    let damage = item.data.data.damage.replace("[STR]", "1d@str").replace("[DEX]", "1d@dex").replace("[INT]", "1d@int").replace("[SPI]", "1d@spi");
                    let accuracyRoll;
                    if (event.currentTarget.classList.contains("accuracy")) {
                        if ((!event.altKey && !event.shiftKey) || (!event.altKey && event.shiftKey)) {
                            accuracyRoll = rollCheck(`${accuracy} + ${item.data.data.accuracyBonus}`, `${actor.name} attacks with their ${item.name}`)
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
        switch (event.target.id) {
            case "roll-travel":
                rollCheck(`1d${str} + 1d${dex}`, `${actor.name} ${game.i18n.localize("RYUU.check.travel")} [STR] + [DEX]`);
                break;
            case "roll-direction":
                rollCheck(`1d${int} + 1d${int}`, `${actor.name} ${game.i18n.localize("RYUU.check.direction")} [INT] + [INT]`);
                break;
            case "roll-camp":
                rollCheck(`1d${dex} + 1d${int}`, `${actor.name} ${game.i18n.localize("RYUU.check.camp")} [DEX] + [INT]`);
                break;
            case "roll-condition":
                const condition = rollCheck(`1d${str} + 1d${spi}`, `${actor.name} ${game.i18n.localize("RYUU.check.condition")} [STR] + [SPI]`);
                actor.update({
                    "data.attributes.condition.value": condition.roll
                })
                break;
            case "roll-initiative":
                const initiative = rollCheck(`1d${dex} + 1d${int}`, `${actor.name} ${game.i18n.localize("RYUU.check.initiative")} [DEX] + [INT]`);
                actor.update({
                    "data.attributes.initiative.value": initiative.roll
                })
                break;
            case "roll-strength":
                rollCheck(`1d${str}`, `${actor.name} ${game.i18n.localize("RYUU.check.str")} [STR]`);
                break;
            case "roll-dexterity":
                rollCheck(`1d${dex}`, `${actor.name} ${game.i18n.localize("RYUU.check.dex")} [DEX]`);
                break;
            case "roll-intelligence":
                rollCheck(`1d${int}`, `${actor.name} ${game.i18n.localize("RYUU.check.int")} [INT]`);
                break;
            case "roll-spirit":
                rollCheck(`1d${spi}`, `${actor.name} ${game.i18n.localize("RYUU.check.spi")} [SPI]`);
                break;
            default:
                break;
        }

        function rollCheck(formula, flavor) {
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
        formData["data.hp.max"] = formData["data.attributes.str.value"] * 2;
        formData["data.mp.max"] = formData["data.attributes.spi.value"] * 2;
        if (!formData["data.hp.value"]) {
            formData["data.hp.value"] = formData["data.hp.max"];
        }
        if (!formData["data.mp.value"]) {
            formData["data.mp.value"] = formData["data.mp.max"];
        }
        formData["data.attributes.level.value"] = RYUU.CHARACTER_EXP_LEVELS.findIndex(i => i > Number(formData["data.attributes.exp.value"]));
        return this.object.update(formData);
    }

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