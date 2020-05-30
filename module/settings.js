export function registerSettings() {
    // Register system settings
    game.settings.register("ryuutama", "macroShorthand", {
        name: "Shortened Macro Syntax",
        hint: "Enable a shortened macro syntax which allows referencing attributes directly, for example @str instead of @attributes.str.value. Disable this setting if you need the ability to reference the full attribute model, for example @attributes.str.label.",
        scope: "world",
        type: Boolean,
        default: true,
        config: true
    });

    // Terrain/Weather/Time
    game.settings.register("ryuutama", "terrain", {
        name: "Current Terrain",
        hint: "",
        scope: "world",
        type: String,
        default: "",
        config: false
    });

    game.settings.register("ryuutama", "weather", {
        name: "Current Weather",
        hint: "",
        scope: "world",
        type: String,
        default: "",
        config: false
    });

    game.settings.register("ryuutama", "night", {
        name: "Current Time",
        hint: "",
        scope: "world",
        type: Boolean,
        default: false,
        config: false
    });

    // Custom terrain settings
    game.settings.register("ryuutama", "terrainName1", {
        name: "Terrain 1 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Grassland",
        config: true
    });

    game.settings.register("ryuutama", "terrain1", {
        name: "Terrain 1 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 6,
        config: true
    });

    game.settings.register("ryuutama", "terrainName2", {
        name: "Terrain 2 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Wasteland",
        config: true
    });

    game.settings.register("ryuutama", "terrain2", {
        name: "Terrain 2 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 6,
        config: true
    });

    game.settings.register("ryuutama", "terrainName3", {
        name: "Terrain 3 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Woods",
        config: true
    });

    game.settings.register("ryuutama", "terrain3", {
        name: "Terrain 3 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 8,
        config: true
    });

    game.settings.register("ryuutama", "terrainName4", {
        name: "Terrain 4 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Highlands",
        config: true
    });

    game.settings.register("ryuutama", "terrain4", {
        name: "Terrain 4 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 8,
        config: true
    });

    game.settings.register("ryuutama", "terrainName5", {
        name: "Terrain 5 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Rocky Terrain",
        config: true
    });

    game.settings.register("ryuutama", "terrain5", {
        name: "Terrain 5 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 8,
        config: true
    });

    game.settings.register("ryuutama", "terrainName6", {
        name: "Terrain 6 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Deep Forest",
        config: true
    });

    game.settings.register("ryuutama", "terrain6", {
        name: "Terrain 6 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 10,
        config: true
    });

    game.settings.register("ryuutama", "terrainName7", {
        name: "Terrain 7 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Swamp",
        config: true
    });

    game.settings.register("ryuutama", "terrain7", {
        name: "Terrain 7 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 10,
        config: true
    });

    game.settings.register("ryuutama", "terrainName8", {
        name: "Terrain 8 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Mountain",
        config: true
    });

    game.settings.register("ryuutama", "terrain8", {
        name: "Terrain 8 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 10,
        config: true
    });

    game.settings.register("ryuutama", "terrainName9", {
        name: "Terrain 9 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Desert",
        config: true
    });

    game.settings.register("ryuutama", "terrain9", {
        name: "Terrain 9 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 12,
        config: true
    });

    game.settings.register("ryuutama", "terrainName10", {
        name: "Terrain 10 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Jungle",
        config: true
    });

    game.settings.register("ryuutama", "terrain10", {
        name: "Terrain 10 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 12,
        config: true
    });

    game.settings.register("ryuutama", "terrainName11", {
        name: "Terrain 11 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Alpine",
        config: true
    });

    game.settings.register("ryuutama", "terrain11", {
        name: "Terrain 11 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 14,
        config: true
    });

    game.settings.register("ryuutama", "terrainName12", {
        name: "Terrain 12 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "",
        config: true
    });

    game.settings.register("ryuutama", "terrain12", {
        name: "Terrain 12 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 0,
        config: true
    });

    game.settings.register("ryuutama", "terrainName13", {
        name: "Terrain 13 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "",
        config: true
    });

    game.settings.register("ryuutama", "terrain13", {
        name: "Terrain 13 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 0,
        config: true
    });

    game.settings.register("ryuutama", "terrainName14", {
        name: "Terrain 14 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "",
        config: true
    });

    game.settings.register("ryuutama", "terrain14", {
        name: "Terrain 14 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 0,
        config: true
    });

    game.settings.register("ryuutama", "terrainName15", {
        name: "Terrain 15 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "",
        config: true
    });

    game.settings.register("ryuutama", "terrain15", {
        name: "Terrain 15 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 0,
        config: true
    });

    game.settings.register("ryuutama", "terrainName16", {
        name: "Terrain 16 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "",
        config: true
    });

    game.settings.register("ryuutama", "terrain16", {
        name: "Terrain 16 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 0,
        config: true
    });

    // Custom weather settings
    game.settings.register("ryuutama", "weatherName1", {
        name: "Weather 1 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Rain",
        config: true
    });

    game.settings.register("ryuutama", "weather1", {
        name: "Weather 1 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 1,
        config: true
    });

    game.settings.register("ryuutama", "weatherName2", {
        name: "Weather 2 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Strong Wind",
        config: true
    });

    game.settings.register("ryuutama", "weather2", {
        name: "Weather 2 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 1,
        config: true
    });

    game.settings.register("ryuutama", "weatherName3", {
        name: "Weather 3 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Fog",
        config: true
    });

    game.settings.register("ryuutama", "weather3", {
        name: "Weather 3 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 1,
        config: true
    });

    game.settings.register("ryuutama", "weatherName4", {
        name: "Weather 4 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Hot",
        config: true
    });

    game.settings.register("ryuutama", "weather4", {
        name: "Weather 4 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 1,
        config: true
    });

    game.settings.register("ryuutama", "weatherName5", {
        name: "Weather 5 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Cold",
        config: true
    });

    game.settings.register("ryuutama", "weather5", {
        name: "Weather 5 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 1,
        config: true
    });

    game.settings.register("ryuutama", "weatherName6", {
        name: "Weather 6 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Hard Rain",
        config: true
    });

    game.settings.register("ryuutama", "weather6", {
        name: "Weather 6 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 3,
        config: true
    });

    game.settings.register("ryuutama", "weatherName7", {
        name: "Weather 7 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Snow",
        config: true
    });

    game.settings.register("ryuutama", "weather7", {
        name: "Weather 7 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 3,
        config: true
    });

    game.settings.register("ryuutama", "weatherName8", {
        name: "Weather 8 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Deep Fog",
        config: true
    });

    game.settings.register("ryuutama", "weather8", {
        name: "Weather 8 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 3,
        config: true
    });

    game.settings.register("ryuutama", "weatherName9", {
        name: "Weather 9 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Dark",
        config: true
    });

    game.settings.register("ryuutama", "weather9", {
        name: "Weather 9 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 3,
        config: true
    });

    game.settings.register("ryuutama", "weatherName10", {
        name: "Weather 10 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Hurricane",
        config: true
    });

    game.settings.register("ryuutama", "weather10", {
        name: "Weather 10 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 5,
        config: true
    });

    game.settings.register("ryuutama", "weatherName11", {
        name: "Weather 11 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "Blizzard",
        config: true
    });

    game.settings.register("ryuutama", "weather11", {
        name: "Weather 11 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 5,
        config: true
    });

    game.settings.register("ryuutama", "weatherName12", {
        name: "Weather 12 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "",
        config: true
    });

    game.settings.register("ryuutama", "weather12", {
        name: "Weather 12 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 0,
        config: true
    });

    game.settings.register("ryuutama", "weatherName13", {
        name: "Weather 13 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "",
        config: true
    });

    game.settings.register("ryuutama", "weather13", {
        name: "Weather 13 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 0,
        config: true
    });

    game.settings.register("ryuutama", "weatherName14", {
        name: "Weather 14 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "",
        config: true
    });

    game.settings.register("ryuutama", "weather14", {
        name: "Weather 14 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 0,
        config: true
    });

    game.settings.register("ryuutama", "weatherName15", {
        name: "Weather 15 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "",
        config: true
    });

    game.settings.register("ryuutama", "weather15", {
        name: "Weather 15 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 0,
        config: true
    });

    game.settings.register("ryuutama", "weatherName16", {
        name: "Weather 16 Name",
        hint: "",
        scope: "world",
        type: String,
        default: "",
        config: true
    });

    game.settings.register("ryuutama", "weather16", {
        name: "Weather 16 DC",
        hint: "",
        scope: "world",
        type: Number,
        default: 0,
        config: true
    });
}