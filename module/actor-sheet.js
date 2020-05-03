/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class RyuutamaActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["ryuutama", "sheet", "actor"],
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
            if (ev.target.value === "Travel") {
                const actor = this.actor;
                const formula = `1d${actor.data.data.attributes.str.value} + 1d${actor.data.data.attributes.dex.value}`;
                const r = new Roll(formula);
                const roll = r.roll();
                roll.toMessage({
                    flavor: `${actor.name} rolled a Travel Check`
                });
            } else if (ev.target.value === "Direction") {
                const actor = this.actor;
                const formula = `1d${actor.data.data.attributes.int.value} + 1d${actor.data.data.attributes.int.value}`;
                const r = new Roll(formula);
                const roll = r.roll();
                roll.toMessage({
                    flavor: `${actor.name} rolled a Direction Check`
                });
            } else if (ev.target.value === "Camp") {
                const actor = this.actor;
                const formula = `1d${actor.data.data.attributes.dex.value} + 1d${actor.data.data.attributes.int.value}`;
                const r = new Roll(formula);
                const roll = r.roll();
                roll.toMessage({
                    flavor: `${actor.name} rolled a Camp Check`
                });
            } else if (ev.target.title === "Condition") {
                const actor = this.actor;
                const formula = `1d${actor.data.data.attributes.str.value} + 1d${actor.data.data.attributes.spi.value}`;
                const r = new Roll(formula);
                const roll = r.roll();
                roll.toMessage({
                    flavor: `${actor.name} rolled a Condition Check`
                });
                actor.update({
                    "data.attributes.condition.value": roll._total
                })
            } else if (ev.target.title === "Initiative") {
                const actor = this.actor;
                const formula = `1d${actor.data.data.attributes.dex.value} + 1d${actor.data.data.attributes.int.value}`;
                const r = new Roll(formula);
                const roll = r.roll();
                roll.toMessage({
                    flavor: `${actor.name} rolled for Initiative`
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
        formData["data.health.max"] = formData["data.attributes.str.value"] * 2;
        formData["data.mental.max"] = formData["data.attributes.spi.value"] * 2;
        const levels = [0, 100, 600, 1200, 2000, 3000, 4200, 5800, 7500, 10000, 100000000];
        formData["data.attributes.level.value"] = levels.findIndex(i => i > Number(formData["data.attributes.exp.value"]));
        return this.object.update(formData);
    }
}