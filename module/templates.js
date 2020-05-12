/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {

  // Define template paths to load
  const templatePaths = [

    // Actor Sheet Partials
    "systems/ryuutama/templates/actor/parts/actor-equipped.html",
    "systems/ryuutama/templates/actor/parts/actor-header.html",
    "systems/ryuutama/templates/actor/parts/actor-items.html",
    "systems/ryuutama/templates/actor/parts/actor-level.html",
    "systems/ryuutama/templates/actor/parts/actor-spells.html",
    "systems/ryuutama/templates/actor/parts/actor-travel.html",

    // Item Sheet Partials
    "systems/ryuutama/templates/item/parts/class-header.html",
    "systems/ryuutama/templates/item/parts/feature-header.html",
    "systems/ryuutama/templates/item/parts/item-container-navigation.html",
    "systems/ryuutama/templates/item/parts/item-header.html",
    "systems/ryuutama/templates/item/parts/item-navigation.html",
    "systems/ryuutama/templates/item/parts/item-traveling.html"
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};