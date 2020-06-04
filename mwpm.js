const HexAssist = (() => {
    let updateRunning = false;
    let pressedKeys = {};
    window.onkeyup = function (e) {
        pressedKeys[e.keyCode] = false;
    };
    window.onkeydown = function (e) {
        pressedKeys[e.keyCode] = true;
    };
    const hookOnpreUpdateWall = async function (scene, wall, update) {
        if (update.hasOwnProperty("c") && pressedKeys[16]) {
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
            let otherWalls = scene.data.walls.filter(w => w._id !== wall._id && ((w.c[0] === endpoint[0] && w.c[1] === endpoint[1]) || (w.c[2] === endpoint[0] && w.c[3] === endpoint[1])));
            let updates = [];
            otherWalls.forEach(other => {
                let coords = [];
                if (other.c[0] === endpoint[0] && other.c[1] === endpoint[1]) {
                    coords = [newEndpoint[0], newEndpoint[1], other.c[2], other.c[3]];
                }
                if (other.c[2] === endpoint[0] && other.c[3] === endpoint[1]) {
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
})();