import {
    RYUU
} from '../config.js';

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class RyuutamaActor extends Actor {
    /**
     * Augment the basic actor data with additional dynamic data.
     */
    prepareData() {
        super.prepareData();

        const actorData = this.data;
        const data = actorData.data;
        const flags = actorData.flags;

        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        if (actorData.type === 'character') this._prepareCharacterData(actorData);
    }

    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData(actorData) {
        const data = actorData.data;
        const items = actorData.items;

        // Health Points
        const oldHP = data.hp.max;
        data.hp.max = data.attributes.str.value * 2;
        if (oldHP != data.hp.max) {
            data.hp.value = data.hp.max;
        }

        // Mental Points
        const oldMP = data.mp.max;
        data.mp.max = data.attributes.spi.value * 2;
        if (oldMP != data.mp.max) {
            data.mp.value = data.mp.max;
        }

        // Level
        data.attributes.level.value = RYUU.CHARACTER_EXP_LEVELS.findIndex(i => i > Number(data.attributes.exp.value));

        // Carrying capacity
        let str = Number(data.attributes.str.value);
        if (data.attributes.str.bonus) {
            str = RYUU.DICE[RYUU.DICE.findIndex(i => i === str) + 1];
        }

        data.attributes.capacity.max = Number(str) + 3;
        const carried = items.filter(i => i.data.equipped === false && i.data.size !== undefined);
        const equipped = items.filter(i => i.data.equipped === true && i.data.size !== undefined);

        let carriedWeight = 0;
        carried.forEach(item => {
            carriedWeight += Number(item.data.size);
        });
        data.attributes.capacity.value = carriedWeight;

        let equippedWeight = 0;
        equipped.forEach(item => {
            equippedWeight += Number(item.data.size);
        });
        data.attributes.capacity.equipped = equippedWeight;

    }



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