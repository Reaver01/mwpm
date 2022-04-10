const MWPM = (() => {
    // Establish a variable to let MWPM know an update is already being performed so we don't go into infinite loops
    let updating = false;
    // Monitor key states
    let pressedKeys = {};
    window.onkeyup = function(e) {
        pressedKeys[e.keyCode] = false;
    };
    window.onkeydown = function(e) {
        pressedKeys[e.keyCode] = true;
    };
    // Hook functions
    const hookOnHoverWall = async function (wall, hover) {
        wall.mouseInteractionManager.options.dragResistance = game.settings.get("mwpm", "resistance") || null;
    }
    const hookOnpreUpdateWall = async function(wall, update) {
        let scene = wall.parent;
        // Retrieve settings
        const reverse = game.settings.get("mwpm", "reverse");
        const key = game.settings.get("mwpm", "key");
        const offset = game.settings.get("mwpm", "offset");
        const del = game.settings.get("mwpm", "delete");
        const coordUpdate = update.hasOwnProperty("c");
        if ((!reverse && coordUpdate && pressedKeys[key]) || (reverse && coordUpdate && !pressedKeys[key])) {
            // Cancel if both endpoints are being moved at the same time
            if ((wall.data.c[0] !== update.c[0] || wall.data.c[1] !== update.c[1]) && (wall.data.c[2] !== update.c[2] || wall.data.c[3] !== update.c[3])) {
                return;
            }
            // Set updating variable
            updating = true;
            // Check if update resides in the first or second half of the coordinates array and set endpoint variables
            let endpoint = [];
            let newEndpoint = [];
            if (wall.data.c[0] !== update.c[0] || wall.data.c[1] !== update.c[1]) {
                endpoint = [wall.data.c[0], wall.data.c[1]];
                newEndpoint = [update.c[0], update.c[1]];
            }
            if (wall.data.c[2] !== update.c[2] || wall.data.c[3] !== update.c[3]) {
                endpoint = [wall.data.c[2], wall.data.c[3]];
                newEndpoint = [update.c[2], update.c[3]];
            }
            // Check for wall segments completely within the offset including the one being moved to delete if needed
            const smallWalls = scene.data.walls.filter(w => (offset > 0 && w.data.c[0] > endpoint[0] - offset && w.data.c[0] < endpoint[0] + offset && w.data.c[1] > endpoint[1] - offset && w.data.c[1] < endpoint[1] + offset) && (offset > 0 && w.data.c[2] > endpoint[0] - offset && w.data.c[2] < endpoint[0] + offset && w.data.c[3] > endpoint[1] - offset && w.data.c[3] < endpoint[1] + offset));
            if (smallWalls.length > 0 && del) {
                let toDelete = [];
                smallWalls.forEach(small => {
                    toDelete.push(small.id);
                });
                await scene.deleteEmbeddedEntity("Wall", toDelete);
            }
            // Get all other walls on the scene that have an endpoint in the same place as the one we are moving
            // If an offset is provided, also get those walls within the offset
            const otherWalls = scene.data.walls.filter(w => (w.id !== wall.id && (((w.data.c[0] === endpoint[0] && w.data.c[1] === endpoint[1]) || (offset > 0 && w.data.c[0] > endpoint[0] - offset && w.data.c[0] < endpoint[0] + offset && w.data.c[1] > endpoint[1] - offset && w.data.c[1] < endpoint[1] + offset)) || ((w.data.c[2] === endpoint[0] && w.data.c[3] === endpoint[1]) || (offset > 0 && w.data.c[2] > endpoint[0] - offset && w.data.c[2] < endpoint[0] + offset && w.data.c[3] > endpoint[1] - offset && w.data.c[3] < endpoint[1] + offset)))));
            let updates = [];
            otherWalls.forEach(other => {
                let coords = [];
                // Check both ends to see if they match and push matching end coords to updates
                if ((other.data.c[0] === endpoint[0] && other.data.c[1] === endpoint[1]) || (offset > 0 && other.data.c[0] > endpoint[0] - offset && other.data.c[0] < endpoint[0] + offset && other.data.c[1] > endpoint[1] - offset && other.data.c[1] < endpoint[1] + offset)) {
                    coords = [newEndpoint[0], newEndpoint[1], other.data.c[2], other.data.c[3]];
                }
                if ((other.data.c[2] === endpoint[0] && other.data.c[3] === endpoint[1]) || (offset > 0 && other.data.c[2] > endpoint[0] - offset && other.data.c[2] < endpoint[0] + offset && other.data.c[3] > endpoint[1] - offset && other.data.c[3] < endpoint[1] + offset)) {
                    coords = [other.data.c[0], other.data.c[1], newEndpoint[0], newEndpoint[1]];
                }
                updates.push({
                    _id: other.id,
                    c: coords
                });
            });
            console.log(updates)
            await scene.updateEmbeddedDocuments("Wall", updates);
            // Reset updating variable
            updating = false;
        }
    };

    // Hooks
    Hooks.on("ready", async function () {
        Hooks.on("hoverWall", async (wall, hover) => {
            await hookOnHoverWall(wall, hover);
        });
        Hooks.on("preUpdateWall", async (wall, update) => {
            // Don't fire hook function if an update is already happening
            if (!updating) {
                await hookOnpreUpdateWall(wall, update);
            }
        });
    });

    Hooks.on("init", function() {
        // Settings
        game.settings.register("mwpm", "reverse", {
            name: "Reverse Behaviour",
            hint: "Reverses key held behavior so that multiple walls move by default, and key must be used to move a single wall.",
            scope: "world",
            config: true,
            default: false,
            type: Boolean
        });
        game.settings.register("mwpm", "key", {
            name: "Key Code",
            hint: "Numerical key code to be used. You can use something like https://keycode.info/ to find the code.",
            scope: "world",
            config: true,
            default: 18,
            type: Number
        });
        game.settings.register("mwpm", "offset", {
            name: "Pixel Offset",
            hint: "Number of pixels to use as an offset if you want to also be able to grab walls endpoints that are close by.",
            scope: "world",
            config: true,
            default: 0,
            type: Number
        });
        game.settings.register("mwpm", "resistance", {
            name: "Drag Resistance",
            hint: "Number of pixels you have to move your mouse on an endpoint before it registers as a drag (0 means default).",
            scope: "world",
            config: true,
            default: 0,
            type: Number
        });
        game.settings.register("mwpm", "delete", {
            name: "Delete small walls",
            hint: "If both wall endpoints fall within the Pixel Offset, delete the wall instead of grabbing one endpoint.",
            scope: "world",
            config: true,
            default: false,
            type: Boolean
        });
    });
})();
