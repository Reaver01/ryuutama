export const RYUU = {};

RYUU.DICE = [4, 6, 8, 12];

RYUU.CHARACTER_EXP_LEVELS = [0, 100, 600, 1200, 2000, 3000, 4200, 5800, 7500, 10000, 100000000];

RYUU.LEVEL_1_TTERRAIN = ["grassland", "wasteland"];
RYUU.LEVEL_2_TTERRAIN = ["woods", "highlands", "rocky"];
RYUU.LEVEL_3_TTERRAIN = ["forest", "swamp", "mountain"];
RYUU.LEVEL_4_TTERRAIN = ["desert", "jungle"];
RYUU.LEVEL_5_TTERRAIN = ["alpine"];

let allTerrain = [];

allTerrain.push(RYUU.LEVEL_1_TTERRAIN);
allTerrain.push(RYUU.LEVEL_2_TTERRAIN);
allTerrain.push(RYUU.LEVEL_3_TTERRAIN);
allTerrain.push(RYUU.LEVEL_4_TTERRAIN);
allTerrain.push(RYUU.LEVEL_5_TTERRAIN);

RYUU.ITEM_BONUS_TERRAIN_TYPES = allTerrain;

RYUU.WEATHER_1 = ["rain", "wind", "fog", "hot", "cold"];
RYUU.WEATHER_3 = ["rain2", "snow", "fog2", "dark"];
RYUU.WEATHER_5 = ["hurricane", "blizzard"];

let allWeather = [];

allTerrain.push(RYUU.WEATHER_1);
allTerrain.push(RYUU.WEATHER_3);
allTerrain.push(RYUU.WEATHER_5);

RYUU.ITEM_BONUS_WEATHER_TYPES = allWeather;