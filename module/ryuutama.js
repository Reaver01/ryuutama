/**
 * The Ryuutama system, developed from the Simple World-Building by Atropos
 * Author: Reaver
 * Software License: GNU GPLv3
 */

// Import Modulesimport {
import {
    RYUU
} from './config.js';
import {
    registerSettings
} from "./settings.js";
import {
    preloadHandlebarsTemplates
} from "./templates.js";
import {
    RyuutamaActor
} from "./actor/actor.js";
import {
    RyuutamaItem
} from "./item/item.js";
import {
    RyuutamaActorSheet
} from "./actor/actor-sheet.js";
import {
    RyuutamaItemSheet
} from "./item/item-sheet.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
    console.log(`Initializing Ryuutama System`);

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "1d@dex + 1d@int",
        decimals: 0
    };

    // Define custom Entity classes
    CONFIG.Actor.entityClass = RyuutamaActor;
    CONFIG.Item.entityClass = RyuutamaItem;

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("ryuutama", RyuutamaActorSheet, {
        makeDefault: true
    });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("ryuutama", RyuutamaItemSheet, {
        makeDefault: true
    });

    // Preload Handlebars Templates
    preloadHandlebarsTemplates();

    // Register Settings
    registerSettings();

    Handlebars.registerHelper({
        eq: (v1, v2) => v1 === v2,
        ne: (v1, v2) => v1 !== v2,
        lt: (v1, v2) => v1 < v2,
        gt: (v1, v2) => v1 > v2,
        lte: (v1, v2) => v1 <= v2,
        gte: (v1, v2) => v1 >= v2,
        and() {
            return Array.prototype.every.call(arguments, Boolean);
        },
        or() {
            return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
        }
    });

    Handlebars.registerHelper("concat", function() {
        var outStr = "";
        for (var arg in arguments) {
            if (typeof arguments[arg] != "object") {
                outStr += arguments[arg];
            }
        }
        return outStr;
    });

    Handlebars.registerHelper("settings", function(setting) {
        return game.settings.get("ryuutama", setting);
    });

    Handlebars.registerHelper("settingsName", function(setting) {
        const s = game.settings.get("ryuutama", setting).replace("terrain", "terrainName").replace("weather", "weatherName");
        if (s) {
            return game.settings.get("ryuutama", s);
        } else {
            return "";
        }
    });

    Handlebars.registerHelper("settingsDC", function(setting) {
        const s = game.settings.get("ryuutama", setting);
        if (s) {
            return game.settings.get("ryuutama", s);
        } else {
            return 0;
        }
    });

});

Hooks.on("renderSidebarTab", (app, html) => {
    let chatForm = html.find("#chat-form");
    let template = "systems/ryuutama/templates/info.html";
    if (game.user.isGM) {
        template = "systems/ryuutama/templates/infoGM.html";
    }
    const options = {};

    renderTemplate(template, options).then(c => {
        if (c.length > 0) {
            let content = $(c);
            chatForm.after(content);
            content.find('.change-terrain').on('change', event => {
                game.settings.set("ryuutama", "terrain", event.target.value);
                console.log(c);
            });
            content.find('.change-weather').on('change', event => {
                game.settings.set("ryuutama", "weather", event.target.value);
            });
            content.find('.change-time').on('change', event => {
                game.settings.set("ryuutama", "night", (event.target.value === "true"));
            });
        }
    });
});

Hooks.on("renderChatMessage", (message, html) => {
    if (!message.isRoll || !message.isRollVisible || !message.roll.parts.length) {
        return;
    }

    const roll = message.roll;
    const dice = roll.dice;
    const smallDice = dice.filter(r => r.faces < 6);
    const maxRolls = dice.filter(r => r.rolls[0].roll === r.faces);
    const largeCrits = dice.filter(r => r.rolls[0].roll === r.faces || r.rolls[0].roll === 6);
    const fumbleRolls = dice.filter(r => r.rolls[0].roll === 1);
    if (dice.length > 1 && ((smallDice && maxRolls.length === dice.length) || (largeCrits.length === dice.length))) {
        html.find(".dice-total").addClass("critical");
    }
    if (dice.length > 1 && fumbleRolls.length === dice.length) {
        html.find(".dice-total").addClass("fumble");
    }

});

Hooks.once("ready", async function() {
    Hooks.on("preCreateItem", (item) => {
        item["data.givenName"] = item.name;
    });

    // Pre create OwnedItem hook
    Hooks.on("preCreateOwnedItem", (actor, item) => {
        if (item.data.container) {
            const container = actor.items.find(i => i.data._id === item.data.container);
            if (container) {
                // Check container size before putting item in it
                if (container.data.data.holdingSize + item.data.size > container.data.data.canHold) {
                    item.data.container = "";
                }
            } else {
                item.data.container = "";
            }
        }
    });

    // Create OwnedItem hook
    Hooks.on("createOwnedItem", async (actor, item) => {
        let holding = [];
        let updateId = '';
        if (item.data.container) {
            const container = actor.items.find(i => i.data._id === item.data.container);
            container.data.data.holding.forEach(held => {
                holding.push(held);
            });
            holding.push({
                id: item._id,
                name: item.name,
                equippable: RYUU.EQUIPPABLE.includes(item.type),
                equip: item.data.equip,
                img: item.img,
                size: item.data.size
            });
            updateId = container.data._id;
        } else if (item.data.holding && item.data.holding.length > 0) {
            let toCreate = [];
            const lastOwner = game.actors.get(item.data.owner);
            item.data.holding.forEach(held => {
                let oldItem = lastOwner.getEmbeddedEntity("OwnedItem", held.id);
                oldItem.data.container = item._id;
                toCreate.push(oldItem);
            });
            let items = await actor.createEmbeddedEntity("OwnedItem", toCreate);
            items.forEach(item => {
                holding.push({
                    id: item._id,
                    name: item.name,
                    equippable: RYUU.EQUIPPABLE.includes(item.type),
                    equip: item.data.equip,
                    img: item.img,
                    size: item.data.size
                });
            });
            updateId = item._id;
        }
        if (holding.length > 0) {
            await actor.updateEmbeddedEntity("OwnedItem", {
                _id: updateId,
                "data.holding": holding
            });
        }
        await actor.updateEmbeddedEntity("OwnedItem", {
            _id: item._id,
            "data.owner": actor.data._id
        });
    });
});