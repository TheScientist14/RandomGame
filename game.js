const frame = document.getElementById("randomGame")
const seedDisplay = document.getElementById("seed")

const rand = new Random(Math.floor(Math.random() * 10000000000000).toString())

const worldDim = [50, 50]
const world = []

const viewportDim = [20, 10]
const playerPos = [1, 1]

function nope(e) {
    e.preventDefault()
    return false
}

frame.addEventListener("keydown", processEvent);
frame.addEventListener("cut", nope);
frame.addEventListener("paste", nope);
frame.addEventListener("input", nope);

function focusGame(e) {
    frame.focus()
}
focusGame()

//#region world

function buildWorld(iSeed) {
    seedDisplay.textContent = '"' + rand.seedTxt + '"'
    world.length = 0
    for (let yy = 0; yy < worldDim[1]; yy++) {
        let line = []
        for (let xx = 0; xx < worldDim[0]; xx++) {
            if (xx == 0 || yy == 0 || xx == worldDim[0] - 1 || yy == worldDim[1] - 1)
                line.push('#')
            else
                line.push('.')
        }
        world.push(line)
    }

    generateChests(iSeed)
    printWorld()
}

function generateChests(iSeed) {

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
                line += "O"
                continue;
            }

            if (!isCoordsValid([xx, yy], worldDim)) {
                line += " "
            }
            else
                line += world[yy][xx]
        }
        lines.push(line)
    }

    frame.innerHTML = lines.join('<br>')
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

    if (world[tmpPlayerPos[1]][tmpPlayerPos[0]] == ".") {
        playerPos[0] = tmpPlayerPos[0]
        playerPos[1] = tmpPlayerPos[1]
        printWorld()
        return true
    }
    return false
}

function interact() {

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


// wall: █
// space: .
// player: O
// closed door: #
// opened chest: ∠
// closed chest: Δ
// key: ю