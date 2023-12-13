const frame = document.getElementById("randomGame")
const body = document.getElementsByClassName("body")
const copyButton = document.getElementById("copySeed")
const pasteButton = document.getElementById("pasteSeed")
const hintButton = document.getElementById("showHint")
const interactButton = document.getElementById("interact")
const seedDisplay = document.getElementById("seed")
const keysDisplay = document.getElementById("keyContainer")

const rand = new Random(Math.floor(Math.random() * 10000000000000).toString())

const worldDim = [51, 51]
const world = []
const colors = [(237, 28, 36), (255, 127, 39), (255, 242, 0), (128, 255, 0), (0, 128, 0), (63, 72, 204), (153, 217, 234), (163, 73, 164), (255, 174, 201), (200, 191, 231)]
const objectStates = null // (color => (chest, door))
const keys = [0, 6, 1]

const viewportDim = [20, 10]
const playerPos = [15, 15]

const allDir = [[1, 0], [0, -1], [-1, 0], [0, 1]]

const voidSpace = " "
const wall = "█"
const space = "."
const player = "O"
const closedDoor = "#"
const openedChest = "∠"
const closedChest = "Δ"
const key = "ю"

class DoorCell {
    constructor(iLockColors) {
        this.lockColors = iLockColors
    }

    toString() {
        return
    }

    open(iColor) {
        this.lockColors
    }
}

function nope(e) {
    e.preventDefault()
    return false
}

frame.addEventListener("keydown", processEvent);
frame.addEventListener("cut", nope);
frame.addEventListener("paste", nope);
frame.addEventListener("input", nope);

copyButton.addEventListener("click", copySeed)
pasteButton.addEventListener("click", readSeed)
hintButton.addEventListener("click", displayHint)
interactButton.addEventListener("click", interact)
function focusGame(e) {
    frame.focus()
}
focusGame()

//#region world

function buildWorld(iSeed) {
    seedDisplay.textContent = '"' + rand.seedTxt + '"'
    world.length = 0
    let roomWidth = Math.floor(worldDim[0] / 5)
    let roomHeight = Math.floor(worldDim[1] / 5)
    for (let yy = 0; yy < worldDim[1]; yy++) {
        let line = []
        for (let xx = 0; xx < worldDim[0]; xx++) {
            if (xx % roomWidth == 0) {
                let wallX = xx / roomWidth
                let wallY = yy / roomHeight
                if (!(wallY >= 1 && wallY <= 4 && (wallX == 2 || wallX == 3)) || ((wallX == 2 || wallX == 3) && wallY >= 2 && wallY <= 3)) {
                    line.push(wall)
                    continue
                }
            }
            if (yy % roomHeight == 0) {
                let wallX = xx / roomWidth
                let wallY = yy / roomHeight
                if (!(wallX >= 1 && wallX <= 4 && (wallY == 2 || wallY == 3)) || ((wallY == 2 || wallY == 3) && wallX >= 2 && wallX <= 3)) {
                    line.push(wall)
                    continue
                }
            }
            line.push(space)
        }
        world.push(line)
    }



    generateChests(iSeed)
    printWorld()
}

// #TODO Verify solvability (TU)
function generateChests(iSeed) {

}

function isCoordsValid(iCoords) {
    return iCoords[0] >= 0 && iCoords[0] < worldDim[0] && iCoords[1] >= 0 && iCoords[1] < worldDim[1]
}

function openChest(iPos) {

}

function openDoor(iPos) {

}

function printWorld() {
    let lines = []
    for (let yy = playerPos[1] - viewportDim[1]; yy <= playerPos[1] + viewportDim[1]; yy++) {
        let line = ""
        for (let xx = playerPos[0] - viewportDim[0]; xx < playerPos[0] + viewportDim[0]; xx++) {
            if (xx == playerPos[0] && yy == playerPos[1]) {
                line += player
                continue;
            }

            if (!isCoordsValid([xx, yy], worldDim)) {
                line += voidSpace
            }
            else
                line += world[yy][xx]
        }
        lines.push(line)
    }

    frame.innerHTML = lines.join('<br>')
    updateDisplayKeys()
}

buildWorld()

function processEvent(e) {
    e.preventDefault();
    switch (e.key) {
        case "ArrowDown":
            movePlayer([0, 1])
            break
        case "ArrowUp":
            movePlayer([0, -1])
            break
        case "ArrowLeft":
            movePlayer([-1, 0])
            break
        case "ArrowRight":
            movePlayer([1, 0])
            break
        case "e":
            interact()
            break
        case "h":
            displayHint()
            break
        case "v":
            readSeed()
            break
        case "c":
            if (e.ctrlKey)
                copySeed()
            break
    }
}

function movePlayer(iDelta) {
    let tmpPlayerPos = [playerPos[0] + iDelta[0], playerPos[1] + iDelta[1]]
    if (!isCoordsValid(tmpPlayerPos))
        return false

    if (world[tmpPlayerPos[1]][tmpPlayerPos[0]] == space) {
        playerPos[0] = tmpPlayerPos[0]
        playerPos[1] = tmpPlayerPos[1]
        printWorld()
        return true
    }
    return false
}

function interact() {
    for (const dir in allDir) {
        let pos = [playerPos[0] + dir[0], playerPos[1] + dir[1]]
        if (isCoordsValid(pos)) {
            let cell = world[pos[1]][pos[0]]
            switch (cell) {
                case closedChest:
                    openChest(pos)
                case closedDoor:
                    openDoor(pos)
            }
        }
    }
}

function displayHint() {

}

function readSeed() {
    let promtSeed = prompt("Enter your seed:");
    if (promtSeed != null && promtSeed != "") {
        rand.setSeed(promtSeed)
        buildWorld()
    }
}

function copySeed() {
    navigator.clipboard.writeText(rand.seedTxt);
    alert("Copied the seed");
}

function updateDisplayKeys() {
    let textToDisplay = ""
    for (const keyIndex in keys) {
        textToDisplay += `<div class="col${keys[keyIndex]}">${key}</div>`
    }
    console.info(textToDisplay)
    keysDisplay.innerHTML = textToDisplay
}