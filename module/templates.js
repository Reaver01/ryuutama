/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {

  // Define template paths to load
  const templatePaths = [

    // Item Sheet Partials
    "systems/ryuutama/templates/item/parts/item-header.html",
    "systems/ryuutama/templates/item/parts/item-navigation.html"
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};