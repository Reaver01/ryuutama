export const RYUU = {};

RYUU.DICE = [4, 6, 8, 12];

RYUU.CHARACTER_EXP_LEVELS = [0, 100, 600, 1200, 2000, 3000, 4200, 5800, 7500, 10000, 100000000];

RYUU.LEVEL_1_TERRAIN = ["grassland", "wasteland"];
RYUU.LEVEL_2_TERRAIN = ["woods", "highlands", "rocky"];
RYUU.LEVEL_3_TERRAIN = ["forest", "swamp", "mountain"];
RYUU.LEVEL_4_TERRAIN = ["desert", "jungle"];
RYUU.LEVEL_5_TERRAIN = ["alpine"];

let allTerrain = [];

allTerrain.push(RYUU.LEVEL_1_TERRAIN);
allTerrain.push(RYUU.LEVEL_2_TERRAIN);
allTerrain.push(RYUU.LEVEL_3_TERRAIN);
allTerrain.push(RYUU.LEVEL_4_TERRAIN);
allTerrain.push(RYUU.LEVEL_5_TERRAIN);

RYUU.ITEM_BONUS_TERRAIN_TYPES = allTerrain;

RYUU.WEATHER_1 = ["rain", "wind", "fog", "hot", "cold"];
RYUU.WEATHER_3 = ["rain2", "snow", "fog2", "dark"];
RYUU.WEATHER_5 = ["hurricane", "blizzard"];

let allWeather = [];

allTerrain.push(RYUU.WEATHER_1);
allTerrain.push(RYUU.WEATHER_3);
allTerrain.push(RYUU.WEATHER_5);

RYUU.ITEM_BONUS_WEATHER_TYPES = allWeather;

RYUU.MAX_HAND = 2;
RYUU.MAX_CHEST = 1;
RYUU.MAX_HEAD = 1;
RYUU.MAX_FACE = 1;
RYUU.MAX_BACK = 1;
RYUU.MAX_ACCESSORY = 2;
RYUU.MAX_FEET = 1;
RYUU.MAX_TRAVEL = 4;