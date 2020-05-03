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
            template: "systems/ryuutama/templates/actor-sheet.html",
            width: 600,
            height: 600,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "description"
            }]
        });
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
        html.find('.check-button').click(ev => {
            const actor = this.actor;
            let str = Number(actor.data.data.attributes.str.value);
            let dex = Number(actor.data.data.attributes.dex.value);
            let int = Number(actor.data.data.attributes.int.value);
            let spi = Number(actor.data.data.attributes.spi.value);
            if (actor.data.data.attributes.str.bonus) {
                str = RYUU.DICE[RYUU.DICE.findIndex(i => i === str) + 1]
            }
            if (actor.data.data.attributes.dex.bonus) {
                dex = RYUU.DICE[RYUU.DICE.findIndex(i => i === dex) + 1]
            }
            if (actor.data.data.attributes.int.bonus) {
                int = RYUU.DICE[RYUU.DICE.findIndex(i => i === int) + 1]
                console.log(RYUU.DICE.findIndex(i => i === int));
            }
            if (actor.data.data.attributes.spi.bonus) {
                int = RYUU.DICE[RYUU.DICE.findIndex(i => i === spi) + 1]
            }
            if (ev.target.value === "Travel") {
                const formula = `1d${str} + 1d${dex}`;
                const r = new Roll(formula);
                const roll = r.roll();
                roll.toMessage({
                    flavor: `${actor.name} ${game.i18n.localize("RYUU.check.travel")}`
                });
            } else if (ev.target.value === "Direction") {
                const formula = `1d${int} + 1d${int}`;
                const r = new Roll(formula);
                const roll = r.roll();
                roll.toMessage({
                    flavor: `${actor.name} ${game.i18n.localize("RYUU.check.direction")}`
                });
            } else if (ev.target.value === "Camp") {
                const formula = `1d${dex} + 1d${int}`;
                const r = new Roll(formula);
                const roll = r.roll();
                roll.toMessage({
                    flavor: `${actor.name} ${game.i18n.localize("RYUU.check.camp")}`
                });
            } else if (ev.target.title === "Condition") {
                const formula = `1d${str} + 1d${spi}`;
                const r = new Roll(formula);
                const roll = r.roll();
                roll.toMessage({
                    flavor: `${actor.name} ${game.i18n.localize("RYUU.check.condition")}`
                });
                actor.update({
                    "data.attributes.condition.value": roll._total
                })
            } else if (ev.target.title === "Inititative") {
                const formula = `1d${dex} + 1d${int}`;
                const r = new Roll(formula);
                const roll = r.roll();
                roll.toMessage({
                    flavor: `${actor.name} ${game.i18n.localize("RYUU.check.initiative")}`
                });
                actor.update({
                    "data.attributes.initiative.value": roll._total
                })
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
            formData["data.hp.value"] = formData["data.hp.max"]
        }
        if (!formData["data.mp.value"]) {
            formData["data.mp.value"] = formData["data.mp.max"]
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