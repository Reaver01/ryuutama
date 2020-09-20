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
        if (actorData.type === "monster") this._prepareMonsterData(actorData);
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

        // Build traveling object
        let traveling = {
            terrain: {},
            weather: {}
        };
        let terrainDC = [0];
        let weatherDC = [0];
        let terrain = [];
        let weather = [];
        let typeMap = [];

        for (let index = 1; index < 17; index++) {
            let tName = game.settings.get("ryuutama", "terrainName" + index);
            let tDC = game.settings.get("ryuutama", "terrain" + index);
            if (tName !== "") {
                terrainDC.push(tDC);
                terrain.push({
                    name: tName,
                    dc: tDC
                });
            }
            let wName = game.settings.get("ryuutama", "weatherName" + index);
            let wDC = game.settings.get("ryuutama", "weather" + index);
            if (wName !== "") {
                weatherDC.push(wDC);
                weather.push({
                    name: wName,
                    dc: wDC
                });
            }
        }

        terrainDC = terrainDC.filter((value, index) => terrainDC.indexOf(value) === index);
        weatherDC = weatherDC.filter((value, index) => weatherDC.indexOf(value) === index);

        for (let index = 1; index < terrainDC.length; index++) {
            traveling.terrain[index] = {
                dc: terrainDC[index],
                types: {}
            };
            terrain.forEach((element, index1) => {
                if (element.dc === terrainDC[index]) {
                    traveling.terrain[index].types["terrain" + (index1 + 1)] = {
                        name: element.name,
                        specialty: false,
                        bonus: 0
                    };
                    typeMap.push({
                        type: "terrain",
                        number: index1 + 1,
                        index: index
                    });
                }
            });
        }

        for (let index = 1; index < weatherDC.length; index++) {
            traveling.weather[index] = {
                dc: weatherDC[index],
                types: {}
            };
            weather.forEach((element, index1) => {
                if (element.dc === weatherDC[index]) {
                    traveling.weather[index].types["weather" + (index1 + 1)] = {
                        name: element.name,
                        specialty: false,
                        bonus: 0
                    };
                    typeMap.push({
                        type: "weather",
                        number: index1 + 1,
                        index: index
                    });
                }
            });
        }

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
                if (data.attributes.level >= key) {
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
            let type = typeMap.find(t => t.type + t.number === specialty);
            if (type) {
                traveling[type.type][type.index].types[type.type + type.number].specialty = true;
            }
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
        if (data.effects.injury > data.attributes.condition.value) {
            dex -= RYUU.DICE_STEP;
        }
        if (data.effects.poison > data.attributes.condition.value) {
            str -= RYUU.DICE_STEP;
        }
        if (data.effects.sickness > data.attributes.condition.value) {
            dex -= RYUU.DICE_STEP;
            str -= RYUU.DICE_STEP;
            spi -= RYUU.DICE_STEP;
            int -= RYUU.DICE_STEP;
        }
        if (data.effects.exhaustion > data.attributes.condition.value) {
            spi -= RYUU.DICE_STEP;
        }
        if (data.effects.muddled > data.attributes.condition.value) {
            int -= RYUU.DICE_STEP;
        }
        if (data.effects.shock > data.attributes.condition.value) {
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
        data.attributes.fumble = Math.clamped(data.attributes.fumble, 0, 999);

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
        typeMap.forEach(type => {
            traveling[type.type][type.index].types[type.type + type.number].bonus = 0;
            let mod = items.filter(i => i.data[type.type + type.number] && i.data.equipped);
            mod.forEach(item => {
                traveling[type.type][type.index].types[type.type + type.number].bonus += item.data.itemBonus;
            });
        });

       data.traveling = traveling;
       data.typeMap = typeMap;
    }

    /**
     * Prepare Character type specific data
     */
    _prepareMonsterData(actorData) {
        const data = actorData.data;
        const toDelete = actorData.items.filter(i => i.type === "enchantment" || i.type === "class" || i.type === "feature");
        const deletions = toDelete.map(i => i._id);
        this.deleteEmbeddedEntity("OwnedItem", deletions);
        let str = Number(data.attributes.str.base);
        let dex = Number(data.attributes.dex.base);
        let int = Number(data.attributes.int.base);
        let spi = Number(data.attributes.spi.base);

        // Don't allow values under min or over max
        data.hp.value = Math.clamped(data.hp.value, 0, data.hp.max);
        data.mp.value = Math.clamped(data.mp.value, 0, data.mp.max);
        data.attributes.str.value = str;
        data.attributes.dex.value = dex;
        data.attributes.int.value = int;
        data.attributes.spi.value = spi;
    }

    /** @override */
    static async create(data, options = {}) {
        data.token = data.token || {};
        if (data.type === "character") {
            mergeObject(data.token, {
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
        if (data.type === "monster") {
            mergeObject(data.token, {
                actorLink: false,
                disposition: -1,
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