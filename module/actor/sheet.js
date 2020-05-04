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
            height: 800,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "abilities"
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
        return data;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

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
        html.find('.roll-button').click(ev => {
            console.log(ev);
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
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.find(i => i.id === li.data("itemId"));
            if (item !== undefined) {
                switch (item.data.type) {
                    case "weapon":
                        let accuracy = item.data.data.accuracy.replace("[STR]", "1d@str").replace("[DEX]", "1d@dex").replace("[INT]", "1d@int").replace("[SPI]", "1d@spi");
                        let damage = item.data.data.damage.replace("[STR]", "1d@str").replace("[DEX]", "1d@dex").replace("[INT]", "1d@int").replace("[SPI]", "1d@spi");
                        let accuracyRoll;
                        if (ev.currentTarget.classList.contains("accuracy")) {
                            accuracyRoll = rollCheck(`${accuracy} + ${item.data.data.accuracyBonus}`, `${actor.name} attacks with their ${item.name}`)
                        }
                        if (ev.currentTarget.classList.contains("damage")) {
                            if (ev.altKey || accuracyRoll.crit) {
                                damage = damage += ` + ${damage}`;
                                rollCheck(`${damage} + ${item.data.data.damageBonus}`, `${item.name} CRITICAL damage:`);
                            } else if (!accuracyRoll.fumble) {
                                rollCheck(`${damage} + ${item.data.data.damageBonus}`, `${item.name} damage:`);
                            }
                        }
                        break;

                    default:
                        break;
                }
            }
            switch (ev.target.id) {
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
                    flavor += game.i18n.localize("RYUU.roll.crit");
                }
                if (dice.length > 1 && fumbleRolls.length === dice.length) {
                    fumble = true;
                    flavor += game.i18n.localize("RYUU.roll.fumble");
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