import {
    RYUU
} from "../config.js";

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

        // Make separate methods for each Actor type (character, npc, etc.) to keep
        // things organized.
        if (actorData.type === "character") this._prepareCharacterData(actorData);
    }

    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData(actorData) {
        const data = actorData.data;
        const items = actorData.items.filter(i => i.type !== "enchantment" && i.type !== "class" && i.type !== "feature");
        const weapons = actorData.items.filter(i => i.type === "weapon");
        const toDelete = actorData.items.filter(i => i.type === "enchantment" || i.type === "feature");
        const deletions = toDelete.map(i => i._id);
        const classes = actorData.items.filter(i => i.type === "class");
        this.deleteEmbeddedEntity("OwnedItem", deletions);
        let str = Number(data.attributes.str.base);
        let dex = Number(data.attributes.dex.base);
        let int = Number(data.attributes.int.base);
        let spi = Number(data.attributes.spi.base);
        let addHp = 0;
        let addMp = 0;
        let addCarry = 0;

        // Class
        classes.forEach(c => {
            switch (c.data.type) {
                case "attack":
                    addHp += 4;
                    break;

                case "technical":
                    addCarry += 3;
                    break;


                case "magic":
                    addMp += 4;
                    break;

                default:
                    break;
            }
            c.data.features.forEach(feature => {
                addCarry += feature.data.capacity;
            });
        });

        // Level
        data.attributes.level = RYUU.CHARACTER_EXP_LEVELS.findIndex(i => i > Number(data.attributes.experience));

        // Level choices
        let specialties = [];
        let immunities = [];
        let mastered = [];
        for (const key in data.levels) {
            if (Object.prototype.hasOwnProperty.call(data.levels, key)) {
                if (data.attributes.level >= data.levels[key].level) {
                    if (Object.prototype.hasOwnProperty.call(data.levels[key], "points")) {
                        data.levels[key].points.hp = Math.clamped(data.levels[key].points.hp, 0, RYUU.POINT_MAX);
                        data.levels[key].points.mp = Math.clamped(data.levels[key].points.mp, 0, RYUU.POINT_MAX - data.levels[key].points.hp);
                        addHp += data.levels[key].points.hp;
                        addMp += data.levels[key].points.mp;
                    }
                    if (Object.prototype.hasOwnProperty.call(data.levels[key], "stat") && data.levels[key].stat === "str") {
                        str += RYUU.DICE_STEP;
                    }
                    if (Object.prototype.hasOwnProperty.call(data.levels[key], "stat") && data.levels[key].stat === "dex") {
                        dex += RYUU.DICE_STEP;
                    }
                    if (Object.prototype.hasOwnProperty.call(data.levels[key], "stat") && data.levels[key].stat === "int") {
                        int += RYUU.DICE_STEP;
                    }
                    if (Object.prototype.hasOwnProperty.call(data.levels[key], "stat") && data.levels[key].stat === "spi") {
                        spi += RYUU.DICE_STEP;
                    }
                    if (Object.prototype.hasOwnProperty.call(data.levels[key], "specialty") && data.levels[key].specialty !== "none") {
                        specialties.push(data.levels[key].specialty);
                    }
                    if (Object.prototype.hasOwnProperty.call(data.levels[key], "immunity") && data.levels[key].immunity !== "none") {
                        immunities.push(data.levels[key].immunity);
                    }
                    if (Object.prototype.hasOwnProperty.call(data.levels[key], "mastered") && data.levels[key].mastered !== "none") {
                        let master = classes.find(i => i.data.features.find(f => f.data.mastered === data.levels[key].mastered));
                        if (master !== undefined) {
                            mastered.push(data.levels[key].mastered);
                        }
                    }
                    if (Object.prototype.hasOwnProperty.call(data.levels[key], "attackMastered") && data.levels[key].attackMastered !== "none") {
                        let master = classes.find(i => i.data.features.find(f => f.data.mastered === data.levels[key].attackMastered));
                        if (master !== undefined) {
                            mastered.push(data.levels[key].mastered);
                        }
                    }
                }
            }
        }

        let updates = [];
        weapons.forEach(weapon => {
            if (mastered.includes(weapon.data.class)) {
                updates.push({
                    _id: weapon._id,
                    "data.masteredBonus": weapon.data.accuracyBonus + 1
                });
            } else {
                updates.push({
                    _id: weapon._id,
                    "data.masteredBonus": weapon.data.accuracyBonus
                });
            }
        });

        this.updateEmbeddedEntity("OwnedItem", updates);

        for (const key in data.specialty) {
            if (Object.prototype.hasOwnProperty.call(data.specialty, key)) {
                data.specialty[key] = false;
            }
        }
        specialties.forEach(specialty => {
            data.specialty[specialty] = true;
        });
        for (const key in data.immunity) {
            if (Object.prototype.hasOwnProperty.call(data.immunity, key)) {
                data.immunity[key] = false;
            }
        }
        immunities.forEach(immunity => {
            data.immunity[immunity] = true;
        });

        // Effects
        for (const name in data.effects) {
            if (Object.prototype.hasOwnProperty.call(data.effects, name) && data.immunity[name]) {
                data.effects[name] = 0;
            }
        }

        // Attribute bonuses
        if (data.attributes.str.bonus) {
            str += RYUU.DICE_STEP;
        }
        if (data.attributes.dex.bonus) {
            dex += RYUU.DICE_STEP;
        }
        if (data.attributes.int.bonus) {
            int += RYUU.DICE_STEP;
        }
        if (data.attributes.spi.bonus) {
            spi += RYUU.DICE_STEP;
        }

        // Status effect decreases
        if (data.effects.injury > 0) {
            dex -= RYUU.DICE_STEP;
        }
        if (data.effects.poison > 0) {
            str -= RYUU.DICE_STEP;
        }
        if (data.effects.sickness > 0) {
            dex -= RYUU.DICE_STEP;
            str -= RYUU.DICE_STEP;
            spi -= RYUU.DICE_STEP;
            int -= RYUU.DICE_STEP;
        }
        if (data.effects.exhaustion > 0) {
            spi -= RYUU.DICE_STEP;
        }
        if (data.effects.muddled > 0) {
            int -= RYUU.DICE_STEP;
        }
        if (data.effects.shock > 0) {
            dex -= RYUU.DICE_STEP;
            str -= RYUU.DICE_STEP;
            spi -= RYUU.DICE_STEP;
            int -= RYUU.DICE_STEP;
        }

        // Health Points
        data.hp.max = (data.attributes.str.base * 2) + addHp;
        const hpItems = items.filter(i => i.data.enchantments.find(e => e.data.hpMod !== 0) && i.data.equipped);
        hpItems.forEach(item => {
            let hpEnchantments = item.data.enchantments.filter(e => e.data.hpMod !== 0);
            hpEnchantments.forEach(enchantment => {
                data.hp.max += enchantment.data.hpMod;
            });
        });

        // Mental Points
        data.mp.max = (data.attributes.spi.base * 2) + addMp;
        const mpItems = items.filter(i => i.data.enchantments.find(e => e.data.mpMod !== 0) && i.data.equipped);
        mpItems.forEach(item => {
            let mpEnchantments = item.data.enchantments.filter(e => e.data.mpMod !== 0);
            mpEnchantments.forEach(enchantment => {
                data.mp.max += enchantment.data.mpMod;
            });
        });

        // Don't allow values under min or over max
        data.hp.value = Math.clamped(data.hp.value, 0, data.hp.max);
        data.mp.value = Math.clamped(data.mp.value, 0, data.mp.max);
        data.attributes.experience = Math.clamped(Number(data.attributes.experience), RYUU.EXP_MIN, RYUU.EXP_MAX);
        data.attributes.condition.value = Math.clamped(data.attributes.condition.value, 0, data.attributes.condition.max);
        data.attributes.str.value = Math.clamped(str, RYUU.DICE_MIN, RYUU.DICE_MAX);
        data.attributes.dex.value = Math.clamped(dex, RYUU.DICE_MIN, RYUU.DICE_MAX);
        data.attributes.int.value = Math.clamped(int, RYUU.DICE_MIN, RYUU.DICE_MAX);
        data.attributes.spi.value = Math.clamped(spi, RYUU.DICE_MIN, RYUU.DICE_MAX);

        // Carrying capacity

        data.attributes.capacity.max = data.attributes.str.value + 2 + data.attributes.level + addCarry;
        const carried = items.filter(i => !i.data.equipped && i.data.size && i.type !== "animal");
        const equipped = items.filter(i => i.data.equipped === true && i.data.size);
        const containers = items.filter(i => i.type === "container" || i.type === "animal");

        let carriedWeight = 0;
        carried.forEach(item => {
            let weightless = item.data.enchantments.find(e => e.data.weightless);
            if (weightless === undefined) {
                let inContainer = false;

                containers.forEach(container => {
                    const found = container.data.holding.find(i => i.id === item._id);
                    if (found) {
                        inContainer = true;
                    }
                });

                if (!inContainer) {
                    carriedWeight += Number(item.data.size);
                }
            }
        });
        data.attributes.capacity.value = carriedWeight;

        let equippedWeight = 0;
        equipped.forEach(item => {
            equippedWeight += Number(item.data.size);
        });
        data.attributes.capacity.equipped = equippedWeight;

        // Terrain
        for (const name in data.traveling) {
            if (Object.prototype.hasOwnProperty.call(data.traveling, name)) {
                data.traveling[name] = 0;
                let mod = items.filter(i => i.data[name] && i.data.equipped);
                mod.forEach(item => {
                    data.traveling[name] += item.data.itemBonus;
                });
            }
        }
    }



    /** @override */
    getRollData() {
        const data = super.getRollData();
        const shorthand = game.settings.get("ryuutama", "macroShorthand");

        // Re-map all attributes onto the base roll data
        if (shorthand) {
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
            if (shorthand) {
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