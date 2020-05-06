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

Hooks.once("init", async function () {
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

    // Register system settings
    game.settings.register("ryuutama", "macroShorthand", {
        name: "Shortened Macro Syntax",
        hint: "Enable a shortened macro syntax which allows referencing attributes directly, for example @str instead of @attributes.str.value. Disable this setting if you need the ability to reference the full attribute model, for example @attributes.str.label.",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    Handlebars.registerHelper('localize2', function (value, value2, options) {
        return game.i18n.localize(value + value2);
    });
});

Hooks.on("renderChatMessage", (message, html, data) => {
    if (!message.isRoll || !message.isRollVisible || !message.roll.parts.length) return;

    const roll = message.roll;
    const dice = roll.dice;
    const smallDice = dice.filter(r => r.faces < 6);
    const maxRolls = dice.filter(r => r.rolls[0].roll === r.faces);
    const largeCrits = dice.filter(r => r.rolls[0].roll === r.faces || r.rolls[0].roll === 6);
    const fumbleRolls = dice.filter(r => r.rolls[0].roll === 1);
    if (dice.length > 1 && ((smallDice !== undefined && maxRolls.length === dice.length) || (largeCrits.length === dice.length))) {
        html.find(".dice-total").addClass("critical");
    }
    if (dice.length > 1 && fumbleRolls.length === dice.length) {
        html.find(".dice-total").addClass("fumble");
    }

});