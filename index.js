let Jimp = require('jimp');
// let fs = require('fs');

// img[][] - 2D array of number. Indexes into array pix[]
// pix[] - 1D array of object for each pixel
// - R G B A - Red Green Blue Opacity
// - x y - location in image.  Use for indexes into array img[][]
// - swapped - has the pixel been swapped with another pixel?
// - group - index into array colorGroup[]
// - vectors[] - 1D array of object, for each vector
//   - x y - location of pixel in that vector direction. Use for indexes into array img[][]
//   - dir - direction. Index into array dir[]
//   - distToCenter - distance from x y to the pix colorGroup[group] centerX centerY. Array is sorted by this value.
// - vectorsUsed - maximum number of vectors. Init to 0. Incremented by 1 each generation. Max value 8, for the 8 directions (see array dir[])
// dir[] - 1D array of object.
// - x y - offsets to the 8 directions: 0=N 1=NW 2=W 3=SW 4=S 5=SE 6=E 7=NE
// vectorMatch[][] - 2D array of boolean.  Indexes are 0-7, the 8 directions. True if two vectors are opposite directions for example N and S, false otherwise.
// pixOrder[] - 2D array of object.  Indexes into pix[] array.  Used to randomize order of array pix[].
// - pixIndex - index into array pix[]
// - order - random number used for sorting
// colorGroup - 1D array of object. Used to define the color groups.
// - centerX centerY - center of color group
// - pixIndex[] - 1D array of numbers. Indexes into array pix[]. List of pixels in this color group.
// colorCube[r][g][b] - 3D array of numbers.  The color group number or -1 if RGB not used.  Each unique poster color is a unique group number.
// imageGroups[x][y] - 1D darray of numbers. Group numbers for that x,y location

// SETTINGS
let debug = false;
let startGeneration =  6001;
let endGeneration   = 10000;
let startingImage = 'gen6000i.png';
let posterImage = 'gen6000i.png'; // posterized (reduced color) image

// SETUP: Define colorCube[R][G][B]
let colorCube = new Array(256);
for (let r = 0; r < 256; r++) {
    colorCube[r] = new Array(256);
    for (let g = 0; g < 256; g++) {
        colorCube[r][g] = new Array(256);
        for (let b = 0; b < 256; b++) {
            colorCube[r][g][b] = -1;
        }
    }
}
// SETUP: Set colorCube[r][g][b]
let colorGroup = [];
let colorGroupSize = 0;
// SETUP: Read poster-image, set imageGroups[x][y] to group
let imageGroups = [];
Jimp.read(posterImage, function(err, image) {
    if (err) {
        throw err;
    }
    let width = image.bitmap.width;
    let height = image.bitmap.height;
    // SETUP: 2D array for poster-image
    imageGroups = new Array(width);
    for (let i = 0; i < width; i++) {
        imageGroups[i] = new Array(height);
    }
    image.scan(0, 0, width, height, function (x, y, idx) {
        let r = this.bitmap.data[idx];
        let g = this.bitmap.data[idx + 1];
        let b = this.bitmap.data[idx + 2];
        if (colorCube[r][g][b] < 0) {
            colorCube[r][g][b] = colorGroupSize++; // set group number to colorCube[r][b][g]
        }
        // NOTE: The same color may go into multiple color groups
        console.log('x=' + x);
        imageGroups[x][y] = colorCube[r][g][b]; // set group number to imageGroups[x][y]
    });
    // SETUP: colorGroup[]
    colorGroup = new Array(colorGroupSize);
    for (let i = 0; i < colorGroupSize; i++) {
        colorGroup[i] = {
            centerX: 0,
            centerY: 0,
            pixIndex: [],
        }
    }
});

Jimp.read(startingImage, function (err, image) {
    if (err) {
        throw err;
    }
    // SETUP: pix.vectors
    let width = image.bitmap.width;
    let height = image.bitmap.height;
    function getPixVectors(pix) {
        if (pix.vectorsUsed < 8) {
            pix.vectorsUsed++;
        }
        pix.vectors = []; // reset vector array
        for (let v = 0; v < 8; v++) {
            let x = pix.x + dir[v].x;
            let y = pix.y + dir[v].y;
            // check for boundary
            // if pixel is in corner, there can only be 3 vectors
            // if pixel is on edge, there can only be 5 vectors
            if ((x >= 0) && (y >= 0) && (x < width) && (y < height)) {
                pix.vectors.push({
                    x: x,
                    y: y,
                    dir: v, // direction: 0=N 1=NW 2=W 3=SW 4=S 5=SE 6=E 7=NE
                    distToCenter: 0,
                });
            }
        }
    }
    // SETUP: 2D array for image
    let img = new Array(width);
    for (let i = 0; i < width; i++) {
        img[i] = new Array(height);
    }
    // SETUP: vector match - define which vectors can swap pix's
    let vectorMatch = new Array(8);
    for (i = 0; i < 8; i++) {
        vectorMatch[i] = [ false, false, false, false, false, false, false, false ];
    }
    vectorMatch[0][4] = true; // N-S
    vectorMatch[1][5] = true; // NW-SE
    vectorMatch[2][6] = true; // W-E
    vectorMatch[3][7] = true; // SW-NE
    vectorMatch[4][0] = true; // S-N
    vectorMatch[5][1] = true; // SE-NW
    vectorMatch[6][2] = true; // E-W
    vectorMatch[7][3] = true; // NE-SW
    let pix = new Array(width * height); // pixels
    let pixOrder = new Array(width * height); // pixel order
    // SETUP: directions for vectors
    let dir = [
        { x:  0, y: -1 }, // N
        { x:  1, y: -1 }, // NW
        { x:  1, y:  0 }, // W
        { x:  1, y:  1 }, // SW
        { x:  0, y:  1 }, // S
        { x: -1, y:  1 }, // SE
        { x: -1, y:  0 }, // E
        { x: -1, y: -1 }, // NE
    ];
    // Setup arrays img[][] and pix[] and colorGroup[].pixIndex[]
    let pixNum = 0;
    image.scan(0, 0, width, height, function (x, y, idx) {
        let R = this.bitmap.data[idx];
        let G = this.bitmap.data[idx + 1];
        let B = this.bitmap.data[idx + 2];
        let A = this.bitmap.data[idx + 3];
        let group = imageGroups[x][y];
        img[x][y] = pixNum;
        pix[pixNum] = {
            R: R,
            G: G,
            B: B,
            A: A,
            x: x,
            y: y,
            swapped: false, // has this pixel been swapped?
            vectors: [],
            vectorsUsed: 0, // most vectors allowed
            group: group, // index into array colorGroup[]
        };
        colorGroup[group].pixIndex.push(pixNum);
        pixNum++;
    });
    // DEBUG: Output how many colors in each color group
    for (let i = 0; i < colorGroupSize; i++) {
        console.log('Color Group ' + i + ' has ' + colorGroup[i].pixIndex.length + ' pixels');
    }
    // Iterate from startGeneration to endGeneration
    let lastAverageDistToCenter = Number.POSITIVE_INFINITY;
    let generation = startGeneration;
    while (generation <= endGeneration) {
        // Calculate center of each color group
        for (let i = 0; i < colorGroupSize; i++) {
            if (colorGroup[i].pixIndex.length > 0) {
                let x = 0;
                let y = 0;
                let count = colorGroup[i].pixIndex.length;
                for (let j = 0; j < count; j++) {
                    let n = colorGroup[i].pixIndex[j];
                    let p = pix[n];
                    x += p.x;
                    y += p.y;
                }
                let div = 1 / count;
                colorGroup[i].centerX = Math.round(x * div);
                colorGroup[i].centerY = Math.round(y * div);
            }
        }
        // Calculate distance to color group center for each vector then sort by distance
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let n = img[x][y];
                let p = pix[n];
                p.swapped = false; // reset swapped back to false
                getPixVectors(p);
                let g = colorGroup[p.group];
                let v = p.vectors;
                for (let i = 0; i < v.length; i++) {
                    let x1 = v[i].x;
                    let y1 = v[i].y;
                    let x2 = g.centerX;
                    let y2 = g.centerY;
                    let x = x1 - x2;
                    let y = y1 - y2;
                    let d = x * x + y * y;
                    v[i].distToCenter = d;
                }
                v.sort(function(a, b) { // sort by distToCenter ascending
                    return a.distToCenter - b.distToCenter;
                });
            }
        }
        // Randomize order of pixels
        for (let i = 0; i < pix.length; i++) {
            pixOrder[i] = {
                pixIndex: i,
                order: Math.random(),
            };
        }
        pixOrder.sort(function(a, b) {
            return a.order - b.order;
        });
        // Find vector matches and swap pixels
        for (let i = 0; i < pixOrder.length; i++) {
            let n1 = pixOrder[i].pixIndex;
            let p1 = pix[n1];
            // if pixel 1 has not been swapped yet
            if (!p1.swapped) {
                let v1 = p1.vectors;
                swapped = false;
                // vector length can be less than vectorsUsed if pixel is in corner or on edge
                let c1 = v1.length <= p1.vectorsUsed ? v1.length : p1.vectorsUsed;
                for (let j = 0; (j < c1) && (!p1.swapped); j++) {
                    let x2 = v1[j].x;
                    let y2 = v1[j].y;
                    let n2 = img[x2][y2];
                    let p2 = pix[n2];
                    // if pixel 2 has not been swapped yet
                    if (!p2.swapped) {
                        let d1 = v1[j].dir; // dir of vector 1
                        let v2 = p2.vectors;
                        // vector length can be less than vectorsUsed if pixel is in corner or on edge
                        let c2 = v2.length <= p2.vectorsUsed ? v2.length : p2.vectorsUsed;
                        for (let k = 0; (k < c2) && (!p2.swapped); k++) {
                            let d2 = v2[k].dir; // dir of vector 2
                            if (vectorMatch[d1][d2]) { // if vector 1 and 2 match
                                let g1 = p1.group;
                                let g2 = p2.group;
                                // if groups are different. Cannot swap with pixel in the same group. This reduces churn and allows groups to pass through each other.
                                if (g1 !== g2) {
                                    let x1 = p1.x;
                                    let y1 = p1.y;
                                    let tmp = img[x1][y1];
                                    img[x1][y1] = img[x2][y2];
                                    img[x2][y2] = tmp;
                                    p1.x = x2;
                                    p1.y = y2;
                                    p2.x = x1;
                                    p2.y = y1;
                                    p1.swapped = true;
                                    p2.swapped = true;
                                    p1.vectorsUsed = 0;
                                    p2.vectorsUsed = 0;
                                }
                            }
                        }
                    }
    
                }
            }
        }
        // Output image with swapped pixels
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let n = img[x][y];
                let p = pix[n];
                let R = p.R;
                let G = p.G;
                let B = p.B;
                let A = p.A;
                let hex = Jimp.rgbaToInt(R, G, B, A);
                image.setPixelColor(hex, x, y);
                // DEBUG: START Change swapped pixels to purple
                if (debug) {
                    let hex = 0;
                    if (p.swapped) {
                        hex = Jimp.rgbaToInt(255, 64, 255, 255);
                    } else {
                        let R = p.R;
                        let G = p.G;
                        let B = p.B;
                        let A = p.A;
                        hex = Jimp.rgbaToInt(R, G, B, A);
                    }
                    image.setPixelColor(hex, x, y);
                }
                // DEBUG: END
            }
        }
        // DEBUG: Show color group center with blue pixels
        if (debug) {
            for (let i = 0; i < colorGroupSize; i++) {
                if (colorGroup[i].pixIndex.length > 0) {
                    let x = colorGroup[i].centerX;
                    let y = colorGroup[i].centerY;
                    let hex = Jimp.rgbaToInt(0, 0, 255, 255);
                    image.setPixelColor(hex, x, y);
                }
            }
        }
        // DEBUG: END
        // DEBUG: Statistics: Average distance to center
        let averageDistToCenter = 0;
        for (let i = 0; i < pix.length; i++) {
            let p = pix[i];
            let g = colorGroup[p.group];
            let x1 = p.x;
            let y1 = p.y;
            let x2 = g.centerX;
            let y2 = g.centerY;
            let x = x1 - x2;
            let y = y1 - y2;
            let d = x * x + y * y;
            averageDistToCenter += d;
        }
        averageDistToCenter = averageDistToCenter / pix.length;
        if (averageDistToCenter < lastAverageDistToCenter) {
            lastAverageDistToCenter = averageDistToCenter;
            console.log('GENERATION ' + generation + ' dist ' + averageDistToCenter + ' IMPROVED!');
            image.write(`gen${generation}i.png`); // save
        } else {
            console.log('GENERATION ' + generation + ' dist ' + averageDistToCenter);
            image.write(`gen${generation}x.png`); // save
        }
        generation++;
    }
});
