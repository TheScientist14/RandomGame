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
const objectStates = null // (color => (chest, door))
const keys = new Set([0, 6, 1])

const viewportDim = [20, 10]
const playerPos = [15, 15]

const allDir = [[1, 0], [0, -1], [-1, 0], [0, 1]]

const voidSpace = " "
const wall = "█"
const space = "."
const player = "O"
const closedDoor = "#"
const openedChest = "Λ"
const closedChest = "A"
const key = "ю"

class DoorCell {
    constructor(iLockColors) {
        this.lockColors = iLockColors
    }

    toString() {
        if (this.lockColors.length == 0)
            return space
        return `<span class="col${this.lockColors[0]}">${closedDoor}</span>`
    }

    getColors() {
        return this.lockColors
    }

    open(iColor) {
        let colIdx = this.lockColors.indexOf(iColor)
        if (colIdx < 0)
            return false

        this.lockColors.splice(colIdx)
        return true
    }
}

class ChestCell {
    constructor(iKeyColor) {
        this.keyColor = iKeyColor
        this.isClosed = true
    }

    toString() {
        if (this.isClosed)
            return `<span class="col${this.keyColor}">${closedChest}</span>`
        else
            return `<span class="col${this.keyColor}">${openedChest}</span>`
    }

    getKeyColor() {
        return this.keyColor
    }

    open() {
        if (this.isClosed) {
            this.isClosed = false
            return true
        }
        return false
    }
}

function nope(e) {
    e.preventDefault()
    return false
}

document.addEventListener("keydown", processEvent)
document.addEventListener("copy", nope)
document.addEventListener("paste", nope)

copyButton.addEventListener("click", copySeed)
pasteButton.addEventListener("click", readSeed)
hintButton.addEventListener("click", displayHint)
interactButton.addEventListener("click", interact)

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
    world[13][13] = new ChestCell(1)
    world[10][13] = new DoorCell([1])
}

function isCoordsValid(iCoords) {
    return iCoords[0] >= 0 && iCoords[0] < worldDim[0] && iCoords[1] >= 0 && iCoords[1] < worldDim[1]
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

function updateDisplayKeys() {
    let textToDisplay = ""
    keys.forEach(keyVal => {
        textToDisplay += `<div class="col${keyVal}">${key}</div>`
    })
    keysDisplay.innerHTML = textToDisplay
}

buildWorld()

function processEvent(e) {
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
            if (e.ctrlKey)
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
    for (let dirIdx in allDir) {
        let pos = [playerPos[0] + allDir[dirIdx][0], playerPos[1] + allDir[dirIdx][1]]
        if (isCoordsValid(pos)) {
            let cell = world[pos[1]][pos[0]]

            if (cell instanceof DoorCell) {
                doorColors = cell.getColors()
                for (colIdx in doorColors) {
                    let col = doorColors[colIdx]
                    if (keys.has(col)) {
                        cell.open(col)
                        keys.delete(col)
                        printWorld()
                    }
                }
                break
            }

            if (cell instanceof ChestCell) {
                if (cell.open()) {
                    keys.add(cell.getKeyColor())
                    printWorld()
                }
                break
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