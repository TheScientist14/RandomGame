const input = document.getElementById("input")
const frame = document.getElementById("randomGame")

function buildWorld(iWorldDim) {
    const localWorld = []
    for (let yy = 0; yy < iWorldDim[1]; yy++) {
        let line = []
        for (let xx = 0; xx < iWorldDim[0]; xx++) {
            if (xx == 0 || yy == 0 || xx == iWorldDim[0] - 1 || yy == iWorldDim[1] - 1)
                line.push('#')
            else
                line.push('.')
        }
        localWorld.push(line)
    }
    return localWorld
}

const worldDim = [20, 30]
const viewportDim = [15, 10]
const world = buildWorld(worldDim)
const playerPos = [4, 4]
world[1][1] = '<span style="color: red">#</span>'

function focusGame(e) {
    input.focus()
}
input.addEventListener("keydown", processEvent);
input.addEventListener("focusout", focusGame);

focusGame()
printWorld()

function processEvent(e) {
    switch (e.key) {
        case "ArrowDown":
            playerPos[1] += 1
            break
        case "ArrowUp":
            playerPos[1] -= 1
            break
        case "ArrowLeft":
            playerPos[0] -= 1
            break
        case "ArrowRight":
            playerPos[0] += 1
            break
    }
    console.log(playerPos)

    printWorld()
}

function isCoordsValid(iCoords, iWorldDim) {
    return iCoords[0] >= 0 && iCoords[0] < iWorldDim[0] && iCoords[1] >= 0 && iCoords[1] < iWorldDim[1]
}

function printWorld() {
    let lines = []
    for (let yy = playerPos[1] - viewportDim[1]; yy <= playerPos[1] + viewportDim[1]; yy++) {
        let line = ""
        for (let xx = playerPos[0] - viewportDim[0]; xx < playerPos[0] + viewportDim[0]; xx++) {
            if (xx == playerPos[0] && yy == playerPos[1]) {
                line += "O"
                continue;
            }

            if (!isCoordsValid([xx, yy], worldDim)) {
                console.log("empty " + xx + "," + yy)
                line += " "
            }
            else
                line += world[yy][xx]
        }
        lines.push(line)
    }

    frame.innerHTML = lines.join('<br>')
}