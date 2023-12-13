const frame = document.getElementById("randomGame")
const body = document.getElementsByClassName("body")
const copyButton = document.getElementById("copySeed")
const pasteButton = document.getElementById("pasteSeed")
const hintButton = document.getElementById("showHint")
const interactButton = document.getElementById("interact")
const seedDisplay = document.getElementById("seed")
const keysDisplay = document.getElementById("keyContainer")

const rand = new Random(Math.floor(Math.random() * 10000000000000).toString())

const allDir = [[1, 0], [0, -1], [-1, 0], [0, 1]]
const allColors = [...Array(10).keys()];

const worldDim = [51, 51]
const maxChestPerRoom = 3
const nbColor = 10
const world = []
const colorGraph = [...Array(nbColor).fill([])] // (color => colorDependencies)
const chestRoomToColor = []
var endColor = null
var possibleSolution = null
const keys = new Set()

// room = (door, center)
const endRoom = [[25, 20], [25, 25]]
const chestRooms = [
    [[15, 10], [15, 5]], [[25, 10], [25, 5]], [[35, 10], [35, 5]],
    [[10, 15], [5, 15]], [[10, 25], [5, 25]], [[10, 35], [5, 35]],
    [[15, 40], [15, 45]], [[25, 40], [25, 45]], [[35, 40], [35, 45]],
    [[40, 15], [45, 15]], [[40, 25], [45, 25]], [[40, 35], [45, 35]]
]

const viewportDim = [20, 10]
const playerPos = [15, 15]

const voidSpace = " "
const wall = "█"
const space = "."
const player = "O"
const closedDoor = "#"
const openedChest = "Λ"
const closedChest = "A"
const key = "ю"
const star = "*"

class DoorCell {
    constructor(iLockColors) {
        this.lockColors = iLockColors
    }

    toString() {
        if (this.lockColors == null || this.lockColors.length == 0)
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

function buildWorld() {
    world.length = 0
    keys.clear()

    seedDisplay.textContent = '"' + rand.seedTxt + '"'

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

    generateColorGraph()
    // console.log(colorGraph)
    generateDoors()
    generateChest()
    world[endRoom[1][1]][endRoom[1][0]] = star

    printWorld()
}

function generateColorGraph() {
    let orderedColors = [...allColors]
    rand.permute(orderedColors)
    // console.log(orderedColors)

    orderedColors.forEach((col, colIdx) => {
        let dependencyCandidates = orderedColors.slice(colIdx + 1)
        let dependencies = []
        let nbDependencies = rand.getRandomIntBetween(Math.min(1, dependencyCandidates.length), Math.min(dependencyCandidates.length, maxChestPerRoom) + 1)
        for (let dependencyIdx = 0; dependencyIdx < nbDependencies; dependencyIdx++)
            if (dependencyIdx == 0)
                dependencies.push(dependencyCandidates.splice(0, 1)[0])
            else
                dependencies.push(rand.popRandomArray(dependencyCandidates))
        colorGraph[col] = dependencies
    })
    endColor = orderedColors[0]
    orderedColors.reverse()
    possibleSolution = orderedColors
}

function placeDoor(iRoom, iRoomColor) {
    //console.log(iRoom)
    let doorCoord = iRoom[0]
    let doorColors = colorGraph[iRoomColor]
    world[doorCoord[1]][doorCoord[0]] = new DoorCell(doorColors)
}

function generateDoors() {
    chestRoomToColor.length = 0
    chestRoomToColor.push(...Array(nbColor).keys())
    chestRoomToColor.splice(endColor, 1)
    rand.permute(chestRoomToColor)

    //console.log(colorGraph)
    //console.log(chestRoomToColor)

    chestRooms.forEach((room, roomIdx) => {
        placeDoor(room, chestRoomToColor[roomIdx])
    })
    placeDoor(endRoom, endColor)
}

// #TODO Verify solvability (TU)
function generateChests() {
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
    let textToDisplay = " "
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

function getDoorOrientation(iCoordDoor, iCoordRoom) {
    let vectorX = iCoordDoor[0] - iCoordRoom[0]
    let vectorY = iCoordDoor[1] - iCoordRoom[1]
    let vectorLength = vectorX + vectorY

    let vectorDir = [vectorX / vectorLength, vectorY / vectorLength]

    return vectorDir
}

function generateChest() {
    chestRoomToColor.length = 0
    chestRoomToColor.push(...Array(nbColor).keys())
    chestRoomToColor.splice(endColor, 1)
    rand.permute(chestRoomToColor)

    //console.log(colorGraph)
    //console.log(chestRoomToColor)

    chestRooms.forEach((room, roomIndex) => {
        placeChest(room, chestRoomToColor[roomIndex])
    })
    placeChest(endRoom, endColor)


}

function placeChest(iRoom, iRoomColor) {
    let roomCenterCoord = iRoom[1]
    let chestColors = colorGraph[iRoomColor]
    if (chestColors == null) return

    let doorOrientation = getDoorOrientation(iRoom[0], iRoom[1])
    console.log(doorOrientation)

    switch (chestColors.length)
    {
        case 1:
            world[roomCenterCoord[1]][roomCenterCoord[0]] = new ChestCell(chestColors[0])
            console.log("case 1")
            break;

        case 2:
            world[roomCenterCoord[1]+doorOrientation[0]][roomCenterCoord[0]-doorOrientation[1]] = new ChestCell(chestColors[0])
            world[roomCenterCoord[1]-doorOrientation[0]][roomCenterCoord[0]+doorOrientation[1]] = new ChestCell(chestColors[1])

            console.log("case 2")
            break;

        case 3: 
            world[roomCenterCoord[1] + doorOrientation[0]][roomCenterCoord[0] - doorOrientation[1]] = new ChestCell(chestColors[0])
            world[roomCenterCoord[1] - doorOrientation[0]][roomCenterCoord[0] + doorOrientation[1]] = new ChestCell(chestColors[1])
            world[roomCenterCoord[1] - doorOrientation[1]][roomCenterCoord[0] - doorOrientation[0]] = new ChestCell(chestColors[2])
            console.log("case 3")
            break;

        default:

            console.log("default")
            break;
    }
}