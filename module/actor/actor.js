/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class RyuutamaActor extends Actor {

    /** @override */
    getRollData() {
        const data = super.getRollData();
        const shorthand = game.settings.get("ryuutama", "macroShorthand");

        // Re-map all attributes onto the base roll data
        if (!!shorthand) {
            for (let [k, v] of Object.entries(data.attributes)) {
                if (!(k in data)) data[k] = v.value;
            }
            delete data.attributes;
        }

        // Map all items data using their slugified names
        data.items = this.data.items.reduce((obj, i) => {
            let key = i.name.slugify({
                strict: true
            });
            let itemData = duplicate(i.data);
            if (!!shorthand) {
                for (let [k, v] of Object.entries(itemData.attributes)) {
                    if (!(k in itemData)) itemData[k] = v.value;
                }
                delete itemData["attributes"];
            }
            obj[key] = itemData;
            return obj;
        }, {});
        return data;
    }

    /** @override */
    static async create(data, options = {}) {
        data.token = data.token || {};
        if (data.type === "character") {
            mergeObject(data.token, {
                vision: true,
                dimSight: 30,
                brightSight: 0,
                actorLink: true,
                disposition: 1,
                displayBars: 40,
                bar1: {
                    attribute: "hp"
                },
                bar2: {
                    attribute: "mp"
                }
            }, {
                overwrite: false
            });
        }
        return super.create(data, options);
    }
}