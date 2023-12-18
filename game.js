const frame = document.getElementById("randomGame")
const body = document.getElementsByClassName("body")
const copyButton = document.getElementById("copySeed")
const pasteButton = document.getElementById("pasteSeed")
const hintButton = document.getElementById("showHint")
const interactButton = document.getElementById("interact")
const seedDisplay = document.getElementById("seed")
const keysDisplay = document.getElementById("keyContainer")

const rand = new Random(Math.floor(Math.random() * 10000000000000).toString())

const up = [0, -1]
const down = [0, 1]
const left = [-1, 0]
const right = [1, 0]
const allDir = [right, up, left, down]

const worldDim = [51, 51]
const maxChestPerRoom = 3
const nbColor = 13
const allColors = [...Array(nbColor).keys()];

const world = []
const colorGraph = [...Array(nbColor).fill([])] // (color => dependantColors)
const chestRoomToColor = []
var endColor = null
var possibleSolution = null
const keys = [] // key = (fromCol, toCol)

// room = (door, center)
const endRoom = [[25, 20], [25, 25]]
const chestRooms = [
    [[15, 10], [15, 5]], [[25, 10], [25, 5]], [[35, 10], [35, 5]],
    [[10, 15], [5, 15]], [[10, 25], [5, 25]], [[10, 35], [5, 35]],
    [[15, 40], [15, 45]], [[25, 40], [25, 45]], [[35, 40], [35, 45]],
    [[40, 15], [45, 15]], [[40, 25], [45, 25]], [[40, 35], [45, 35]]
]

const viewportDim = [20, 10]
const playerPos = [0, 0]

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
    constructor(iLockColors, iRoomColor) {
        this.lockColors = iLockColors
        this.roomColor = iRoomColor
    }

    toString() {
        if (this.isOpened())
            return `<span class="col${this.roomColor}">${space}</span>`
        return `<span class="col${this.lockColors[0]} otherCol${this.roomColor}">${closedDoor}</span>`
    }

    getLockColors() {
        return this.lockColors
    }

    getRoomColor() {
        return this.roomColor
    }

    open(iKeyColors) {
        if (iKeyColors[1] != this.roomColor)
            return false

        let colIdx = this.lockColors.indexOf(iKeyColors[0])
        if (colIdx < 0)
            return false

        this.lockColors.splice(colIdx, 1)
        return true
    }

    isOpened() {
        return this.lockColors == null || this.lockColors.length == 0
    }
}

class ChestCell {
    constructor(iRoomColor, iKeyColor) {
        this.roomColor = iRoomColor
        this.keyColor = iKeyColor
        this.isClosed = true
    }

    toString() {
        if (this.isClosed)
            return `<span class="col${this.roomColor} otherCol${this.keyColor}">${closedChest}</span>`
        else
            return `<span class="col${this.roomColor} otherCol${this.keyColor}">${openedChest}</span>`
    }

    getKeyColors() {
        return [this.roomColor, this.keyColor]
    }

    open() {
        if (this.isClosed) {
            this.isClosed = false
            return true
        }
        return false
    }
}

class SpaceCell {
    constructor(iColor = null) {
        this.color = iColor
    }

    toString() {
        if (this.color == null)
            return space
        return `<span class="col${this.color}">${space}</span>`
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

function computeGraphCharacteristics() {
    let seedBackup = rand.seedTxt

    // min is nbColor factorial
    let minSolution = 1
    for (let ii = 0; ii < nbColor; ii++)
        minSolution *= (ii + 1)
    let maxSolution = 0
    let sumSolution = 0
    let solutionNumbers = []

    const nbIter = 1000
    const nbThermoStep = 20
    const thermoStep = Math.trunc(nbIter / nbThermoStep)
    let thermo = 0
    let step = 0

    console.log("Benchmarking nb of solutions:")
    console.log("Nb of generations:", nbIter)

    for (let ii = 0; ii < nbIter; ii++) {
        thermo++
        if (thermo >= thermoStep) {
            thermo = 0
            step++
            console.log(`${step * 100 / nbThermoStep}%`)
        }
        generateColorGraph()
        let nbSolutions = getAllSolutions().length
        minSolution = Math.min(minSolution, nbSolutions)
        maxSolution = Math.max(maxSolution, nbSolutions)
        sumSolution += nbSolutions
        solutionNumbers.push(nbSolutions)
    }
    console.log("Sorting...")
    solutionNumbers.sort()
    let medianIdx = Math.trunc(nbIter / 2)
    let medianNbSolution = solutionNumbers[medianIdx]
    if (nbIter % 2 == 0) {
        medianNbSolution += solutionNumbers[medianIdx + 1]
        medianNbSolution /= 2
    }

    let avgNbSolution = sumSolution / nbIter
    let stdDevNbSolution = 0
    solutionNumbers.forEach(nbSolution => stdDevNbSolution += (avgNbSolution - nbSolution) ** 2)
    stdDevNbSolution /= nbIter
    stdDevNbSolution = Math.sqrt(stdDevNbSolution)

    console.log("min:", minSolution)
    console.log("max:", maxSolution)
    console.log("avg:", avgNbSolution)
    console.log("med:", medianNbSolution)
    console.log("stdDev:", stdDevNbSolution)

    rand.setSeed(seedBackup)
}

function buildWorld() {
    world.length = 0
    keys.length = 0
    playerPos[0] = 15
    playerPos[1] = 15

    seedDisplay.textContent = '"' + rand.seedTxt + '"'

    generateColorGraph()
    let solutions = getAllSolutions()
    console.log("Solutions number:", solutions.length)
    mapColorsToRooms()

    const nbRooms = 5
    let roomWidth = Math.floor(worldDim[0] / nbRooms)
    let roomHeight = Math.floor(worldDim[1] / nbRooms)
    for (let yy = 0; yy < worldDim[1]; yy++) {
        let line = []
        for (let xx = 0; xx < worldDim[0]; xx++) {
            // vertical walls
            if (xx % roomWidth == 0) {
                let wallX = xx / roomWidth
                let wallY = yy / roomHeight
                if (!(wallY >= 1 && wallY <= 4 && (wallX == 2 || wallX == 3)) || ((wallX == 2 || wallX == 3) && wallY >= 2 && wallY <= 3)) {
                    line.push(wall)
                    continue
                }
            }
            // horizontal walls
            if (yy % roomHeight == 0) {
                let wallX = xx / roomWidth
                let wallY = yy / roomHeight
                if (!(wallX >= 1 && wallX <= 4 && (wallY == 2 || wallY == 3)) || ((wallY == 2 || wallY == 3) && wallX >= 2 && wallX <= 3)) {
                    line.push(wall)
                    continue
                }
            }
            // corner rooms
            if ((xx < roomWidth && yy < roomHeight)
                || (xx > roomWidth * (nbRooms - 1) && yy < roomHeight)
                || (xx < roomWidth && yy > roomHeight * (nbRooms - 1))
                || (xx > roomWidth * (nbRooms - 1) && yy > roomHeight * (nbRooms - 1))
            ) {
                line.push(wall)
                continue
            }

            let color = null
            // coloredRooms
            let nearestCenterIdx = -1
            let isNearEnd = false
            let minVect = [worldDim[0], worldDim[1]]
            chestRooms.forEach((room, roomIdx) => {
                let roomCenter = room[1]
                let vect = [Math.abs(roomCenter[0] - xx), Math.abs(roomCenter[1] - yy)]
                if (vect[0] + vect[1] < minVect[0] + minVect[1]) {
                    minVect = vect
                    nearestCenterIdx = roomIdx
                }
            })
            let endRoomCenter = endRoom[1]
            let vect = [Math.abs(endRoomCenter[0] - xx), Math.abs(endRoomCenter[1] - yy)]
            if (vect[0] + vect[1] < minVect[0] + minVect[1]) {
                minVect = vect
                isNearEnd = true
            }
            if (minVect[0] < roomWidth / 2 && minVect[1] < roomHeight / 2) {
                if (isNearEnd)
                    color = endColor
                else
                    color = chestRoomToColor[nearestCenterIdx]
            }

            line.push(new SpaceCell(color))
        }
        world.push(line)
    }

    generateDoors()
    generateChests()
    world[endRoom[1][1]][endRoom[1][0]] = star

    printWorld()
}

function generateColorGraph() {
    let orderedColors = [...allColors]
    rand.permute(orderedColors)

    orderedColors.forEach((col, colIdx) => {
        let dependencyCandidates = orderedColors.slice(colIdx + 1)
        let dependants = []
        let nbDependencies = rand.getRandomIntBetween(Math.min(1, dependencyCandidates.length), Math.min(dependencyCandidates.length, maxChestPerRoom) + 1)
        for (let dependencyIdx = 0; dependencyIdx < nbDependencies; dependencyIdx++)
            dependants.push(rand.popRandomArray(dependencyCandidates))

        colorGraph[col] = dependants
    })
    endColor = orderedColors[nbColor - 1]
    possibleSolution = orderedColors
}

function reverseGraph(iGraph) {
    let reversedGraph = []
    for (_ in iGraph)
        reversedGraph.push([])

    for (idx in iGraph) {
        let links = iGraph[idx]
        for (linkIdx in links)
            reversedGraph[links[linkIdx]].push(Number(idx))
    }

    return reversedGraph
}

function getAccessibleUnvisitedNodes(iGraph, iVisitedNodes) {
    let accessibleNodes = []
    iGraph.forEach((dependancies, node) => {
        if (iVisitedNodes.includes(node))
            return
        let isAvailable = true
        dependancies.forEach(dependancy => {
            if (!iVisitedNodes.includes(dependancy))
                isAvailable = false
        })
        if (isAvailable)
            accessibleNodes.push(node)
    })
    return accessibleNodes
}

function getAllSolutions() {
    let solutions = []
    let depenciesGraph = reverseGraph(colorGraph)

    let stack = [[]]
    while (stack.length > 0) {
        let visitedNodes = stack.pop()

        if (visitedNodes.includes(endColor)) {
            solutions.push(visitedNodes.join(";"))
            if (visitedNodes.length != nbColor)
                console.warning("A solution that does not require all nodes has been found:", visitedNodes)
            continue
        }

        let availableNodes = getAccessibleUnvisitedNodes(depenciesGraph, visitedNodes)
        availableNodes.forEach(nodeToVisit => {
            let nextVisited = visitedNodes.map(x => x)
            nextVisited.push(nodeToVisit)
            stack.push(nextVisited)
        })
    }

    return solutions
}

function mapColorsToRooms() {
    chestRoomToColor.length = 0
    chestRoomToColor.push(...Array(nbColor).keys())
    chestRoomToColor.splice(endColor, 1)
    rand.permute(chestRoomToColor)
}

function placeDoor(iRoom, iRoomColor) {
    let doorCoord = iRoom[0]
    let lockColors = []
    colorGraph.forEach((dependants, colIdx) => {
        if (dependants.includes(iRoomColor)) lockColors.push(colIdx)
    })
    world[doorCoord[1]][doorCoord[0]] = new DoorCell(lockColors, iRoomColor)
}

function generateDoors() {
    chestRooms.forEach((room, roomIdx) => {
        placeDoor(room, chestRoomToColor[roomIdx])
    })
    placeDoor(endRoom, endColor)
}

function getDoorOrientation(iCoordDoor, iCoordRoom) {
    let vectorX = iCoordDoor[0] - iCoordRoom[0]
    let vectorY = iCoordDoor[1] - iCoordRoom[1]
    let vectorLength = Math.abs(vectorX) + Math.abs(vectorY)

    let vectorDir = [vectorX / vectorLength, vectorY / vectorLength]

    return vectorDir
}

function generateChests() {
    chestRooms.forEach((room, roomIndex) => {
        placeChest(room, chestRoomToColor[roomIndex])
    })
}

function placeChest(iRoom, iRoomColor) {
    let roomCenterCoord = iRoom[1]
    let chestColors = colorGraph[iRoomColor]
    if (chestColors == null) return

    let doorOrientation = getDoorOrientation(iRoom[0], iRoom[1])

    switch (chestColors.length) {
        case 1:
            world[roomCenterCoord[1]][roomCenterCoord[0]] = new ChestCell(iRoomColor, chestColors[0])
            break
        case 2:
            world[roomCenterCoord[1] + doorOrientation[0]][roomCenterCoord[0] - doorOrientation[1]] = new ChestCell(iRoomColor, chestColors[0])
            world[roomCenterCoord[1] - doorOrientation[0]][roomCenterCoord[0] + doorOrientation[1]] = new ChestCell(iRoomColor, chestColors[1])
            break
        case 3:
            world[roomCenterCoord[1] + doorOrientation[0]][roomCenterCoord[0] - doorOrientation[1]] = new ChestCell(iRoomColor, chestColors[0])
            world[roomCenterCoord[1] - doorOrientation[0]][roomCenterCoord[0] + doorOrientation[1]] = new ChestCell(iRoomColor, chestColors[1])
            world[roomCenterCoord[1] - doorOrientation[1]][roomCenterCoord[0] - doorOrientation[0]] = new ChestCell(iRoomColor, chestColors[2])
            break
    }
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
    keys.forEach(keyCols => {
        textToDisplay += `<div class="col${keyCols[0]} otherCol${keyCols[1]}">${key}</div>`
    })
    keysDisplay.innerHTML = textToDisplay
}

// computeGraphCharacteristics()
buildWorld()

function processEvent(e) {
    switch (e.key) {
        case "ArrowDown":
            movePlayer(down)
            break
        case "ArrowUp":
            movePlayer(up)
            break
        case "ArrowLeft":
            movePlayer(left)
            break
        case "ArrowRight":
            movePlayer(right)
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
        default:
            return
    }
    e.preventDefault()
}

function movePlayer(iDelta) {
    let tmpPlayerPos = [playerPos[0] + iDelta[0], playerPos[1] + iDelta[1]]
    if (!isCoordsValid(tmpPlayerPos))
        return false

    let canMove = false
    let cell = world[tmpPlayerPos[1]][tmpPlayerPos[0]]

    if (cell instanceof SpaceCell)
        canMove = true

    if (cell instanceof DoorCell) {
        if (cell.isOpened())
            canMove = true
    }

    if (!canMove)
        return false

    playerPos[0] = tmpPlayerPos[0]
    playerPos[1] = tmpPlayerPos[1]
    printWorld()
    return true
}

function interact() {
    for (let dirIdx in allDir) {
        let pos = [playerPos[0] + allDir[dirIdx][0], playerPos[1] + allDir[dirIdx][1]]
        if (isCoordsValid(pos)) {
            let cell = world[pos[1]][pos[0]]

            if (cell instanceof DoorCell) {
                let lockColor = cell.getLockColors()[0]
                let roomColor = cell.getRoomColor()

                let keyIdx = -1
                keys.forEach((key, idx) => {
                    if (key[0] == lockColor && key[1] == roomColor)
                        keyIdx = idx
                })
                if (keyIdx < 0)
                    continue
                if (!cell.open([lockColor, roomColor]))
                    continue

                keys.splice(keyIdx, 1)
                printWorld()
                return
            }

            if (cell instanceof ChestCell) {
                if (!cell.open())
                    continue
                keys.push(cell.getKeyColors())
                printWorld()
                return
            }

            if (cell == star) {
                alert("You won!\nRestart?")
                rand.setSeed(Math.floor(Math.random() * 10000000000000).toString())
                buildWorld()
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
