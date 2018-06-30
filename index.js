let Jimp = require('jimp');

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
// - center - object
//   - x y - center of color group
// - pixIndex[] - 1D array of numbers. Indexes into array pix[]. List of pixels in this color group.

Jimp.read('a.png', function (err, image) {
    if (err) {
        throw err;
    }
    function getPixVectors(pix) {
        if (pix.vectorsUsed < vectorMax) {
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
    // SETTINGS
    let generations = 5000;
    let size = 16; // 1 2 4 8 16 32 64 128 256
    let blocks = 256 / size; // per Red, Green or Blue
    let vectorMax = 6; // how many vectors to consider when looking for a vector match
    // SETUP: colorGroup[] width and height
    let colorGroup = new Array(blocks * blocks * blocks);
    let width = image.bitmap.width;
    let height = image.bitmap.height;
    // SETUP: 2D array for image
    let img = new Array(width);
    for (let i = 0; i < width; i++) {
        img[i] = new Array(height);
    }
    // console.log('Init colorGroup array ' + colorGroup.length);
    // SETUP: colorGroup[]
    for (let i = 0; i < colorGroup.length; i++) {
        colorGroup[i] = {
            center: { x: 0, y: 0 },
            pixIndex: []
        };
    }
    // SETUP: vector match - define which vectors can swap pix
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
        let R1 = Math.abs(Math.round(R / size - 0.5));
        let G1 = Math.abs(Math.round(G / size - 0.5));
        let B1 = Math.abs(Math.round(B / size - 0.5));
        let group = R1 + blocks * (G1 + blocks * B1);
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
    // Iterate the generations
    let gen = 1;
    while (gen <= generations) {
        console.log('GENERATION: ' + gen);
        // console.log('Calc center of each color group');
        // Calculate center of each color group
        for (let i = 0; i < colorGroup.length; i++) {
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
                colorGroup[i].center = {
                    x: Math.round(x / count),
                    y: Math.round(y / count),
                }
            }
        }
        // console.log('Calc distance to color group center for each vector then sort by distance');
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
                    let x2 = g.center.x;
                    let y2 = g.center.y;
                    let x = x1 - x2;
                    let y = y1 - y2;
                    let d = Math.sqrt(x * x + y * y);
                    v[i].distToCenter = d;
                }
                v.sort(function(a, b) { // sort by distToCenter ascending
                    return a.distToCenter - b.distToCenter;
                });
            }
        }
        // console.log('Randomize order of pixels');
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
        // console.log('Find vector matches and swap pixels');
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
        // console.log('Output image with swapped pixels');
        // TODO: Output image with swapped pixels
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
            }
        }
        // DEBUG: Show color group center with black pixels
        for (let i = 0; i < colorGroup.length; i++) {
            if (colorGroup[i].pixIndex.length > 0) {
                let x = colorGroup[i].center.x;
                let y = colorGroup[i].center.y;
                let hex = Jimp.rgbaToInt(0, 0, 0, 255);
                image.setPixelColor(hex, x, y);
            }
        }
        // DEBUG: Statistics: Average distance to center
        let averageDistToCenter = 0;
        for (let i = 0; i < pix.length; i++) {
            let p = pix[i];
            let g = colorGroup[p.group];
            let x1 = p.x;
            let y1 = p.y;
            let x2 = g.center.x;
            let y2 = g.center.y;
            let x = x1 - x2;
            let y = y1 - y2;
            let d = Math.sqrt(x * x + y * y);
            averageDistToCenter += d;
        }
        averageDistToCenter = averageDistToCenter / pix.length;
        console.log('Average Distance to color group centers ' + averageDistToCenter);
        image.write(`gen${gen}.png`); // save
        gen++;
    }
});
