const MWPM = (() => {
    let updateRunning = false;
    let pressedKeys = {};
    window.onkeyup = function (e) {
        pressedKeys[e.keyCode] = false;
    };
    window.onkeydown = function (e) {
        pressedKeys[e.keyCode] = true;
    };
    const hookOnpreUpdateWall = async function (scene, wall, update) {
        if ((!game.settings.get("mwpm", "reverse") && update.hasOwnProperty("c") && pressedKeys[game.settings.get("mwpm", "key")]) || (game.settings.get("mwpm", "reverse") && update.hasOwnProperty("c") && !pressedKeys[game.settings.get("mwpm", "key")])) {
            updateRunning = true;
            let endpoint = [];
            let newEndpoint = [];
            if ((wall.c[0] !== update.c[0] || wall.c[1] !== update.c[1]) && (wall.c[2] !== update.c[2] || wall.c[3] !== update.c[3])) {
                updateRunning = false;
                return;
            }
            if (wall.c[0] !== update.c[0] || wall.c[1] !== update.c[1]) {
                endpoint = [wall.c[0], wall.c[1]];
                newEndpoint = [update.c[0], update.c[1]];
            }
            if (wall.c[2] !== update.c[2] || wall.c[3] !== update.c[3]) {
                endpoint = [wall.c[2], wall.c[3]];
                newEndpoint = [update.c[2], update.c[3]];
            }
            let offset = game.settings.get("mwpm", "offset");
            let smallWalls = scene.data.walls.filter(w => (offset > 0 && w.c[0] > endpoint[0] - offset && w.c[0] < endpoint[0] + offset && w.c[1] > endpoint[1] - offset && w.c[1] < endpoint[1] + offset) && (offset > 0 && w.c[2] > endpoint[0] - offset && w.c[2] < endpoint[0] + offset && w.c[3] > endpoint[1] - offset && w.c[3] < endpoint[1] + offset));
            console.log(smallWalls);
            if (smallWalls.length > 0 && game.settings.get("mwpm", "delete")) {
                deleteUpdates = [];
                smallWalls.forEach(small => {
                    deleteUpdates.push(small._id);
                });
                await scene.deleteEmbeddedEntity("Wall", deleteUpdates);
            }
            let otherWalls = scene.data.walls.filter(w => w._id !== wall._id && (((w.c[0] === endpoint[0] && w.c[1] === endpoint[1]) || (offset > 0 && w.c[0] > endpoint[0] - offset && w.c[0] < endpoint[0] + offset && w.c[1] > endpoint[1] - offset && w.c[1] < endpoint[1] + offset)) || ((w.c[2] === endpoint[0] && w.c[3] === endpoint[1]) || (offset > 0 && w.c[2] > endpoint[0] - offset && w.c[2] < endpoint[0] + offset && w.c[3] > endpoint[1] - offset && w.c[3] < endpoint[1] + offset))));
            let updates = [];
            otherWalls.forEach(other => {
                let coords = [];
                if ((other.c[0] === endpoint[0] && other.c[1] === endpoint[1]) || (offset > 0 && other.c[0] > endpoint[0] - offset && other.c[0] < endpoint[0] + offset && other.c[1] > endpoint[1] - offset && other.c[1] < endpoint[1] + offset)) {
                    coords = [newEndpoint[0], newEndpoint[1], other.c[2], other.c[3]];
                }
                if ((other.c[2] === endpoint[0] && other.c[3] === endpoint[1]) || (offset > 0 && other.c[2] > endpoint[0] - offset && other.c[2] < endpoint[0] + offset && other.c[3] > endpoint[1] - offset && other.c[3] < endpoint[1] + offset)) {
                    coords = [other.c[0], other.c[1], newEndpoint[0], newEndpoint[1]];
                }
                updates.push({
                    _id: other._id,
                    c: coords
                });
            });
            await scene.updateEmbeddedEntity("Wall", updates);
            updateRunning = false;
        }
    };

    Hooks.on("ready", async function () {
        Hooks.on("preUpdateWall", async (scene, wall, update) => {
            if (!updateRunning) {
                await hookOnpreUpdateWall(scene, wall, update);
            }
        });
    });

    Hooks.on("init", function () {
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