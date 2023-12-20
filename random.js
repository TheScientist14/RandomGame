class Random {
    constructor(iSeed) {
        this.setSeed(iSeed)
    }

    // inclusive min, exclusive max
    getRandomIntBetween(iMin, iMax) {
        let min = Math.ceil(iMin);
        let max = Math.floor(iMax);
        return Math.floor(this.rand() * (max - min) + min);
    }

    // min = 0, exclusive max
    getRandomIntBelow(iMax) {
        return this.getRandomIntBetween(0, iMax)
    }

    popRandomArray(iArray) {
        let idx = this.getRandomIntBelow(iArray.length)
        return iArray.splice(idx, 1)[0]
    }

    permute(iArray) {
        for (let ii = 0; ii < iArray.length - 1; ii++) { // last one can only permutate with itself
            let permutatedIdx = this.getRandomIntBetween(ii, iArray.length)
            if (ii == permutatedIdx)
                continue
            let permutatedVal = iArray[permutatedIdx]
            iArray[permutatedIdx] = iArray[ii]
            iArray[ii] = permutatedVal
        }
    }

    setSeed(iSeed) {
        this.seedTxt = iSeed
        this.seed = cyrb128(iSeed)
        this.rand = mulberry32(this.seed[0])
    }
}

/////////////////////////////////////////////
// From https://stackoverflow.com/a/47593316
/////////////////////////////////////////////

function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// test random
// {
// let randTest = new Random("test")
// let nbOccurence = []
// nbOccurence.length = 10
// nbOccurence.fill(value = 0, end = 10)
// for (let ii = 0; ii < 10000; ii++)
//     nbOccurence[randTest.getRandomIntBelow(10)] += 1
// console.log(nbOccurence)
// }

// test permutations
// {
// let randTest = new Random("test")
// let nbNumber = 10
// let nbOccurence = []
// for (let idx = 0; idx < nbNumber; idx++)
//     nbOccurence.push([...Array(10).fill(0)])
// for (let ii = 0; ii < 10000; ii++) {
//     let numbers = [...Array(nbNumber).keys()]
//     randTest.permute(numbers)
//     for (let idx = 0; idx < nbNumber; idx++)
//         nbOccurence[idx][numbers[idx]]++
// }
// console.log(nbOccurence)
// }