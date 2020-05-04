/**
 * The Ryuutama system, developed from the Simple World-Building by Atropos
 * Author: Reaver
 * Software License: GNU GPLv3
 */

// Import Modules
import {
    RyuutamaActor
} from "./actor/actor.js";
import {
    RyuutamaItemSheet
} from "./item/sheet.js";
import {
    RyuutamaActorSheet
} from "./actor/sheet.js";

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

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("dnd5e", RyuutamaActorSheet, {
        makeDefault: true
    });
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("dnd5e", RyuutamaItemSheet, {
        makeDefault: true
    });

    // Register system settings
    game.settings.register("ryuutama", "macroShorthand", {
        name: "Shortened Macro Syntax",
        hint: "Enable a shortened macro syntax which allows referencing attributes directly, for example @str instead of @attributes.str.value. Disable this setting if you need the ability to reference the full attribute model, for example @attributes.str.label.",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
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