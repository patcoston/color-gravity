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
// - name - string of color name
// - hex[] - array of strings of hex colors
// - center - object
//   - x y - center of color group
// - pixIndex[] - 1D array of numbers. Indexes into array pix[]. List of pixels in this color group.
// colors[] - array of objects
// - R G B - Red Green Blue
// - group - index into colorGroup[] array
// - hexIndex - index into array colorGroup[].hex[]
// - name - name of color

function getFirstColorInGroup(group) {
    for (let i = 0; i < colors.length; i++) {
        if (colors[i].group === group) {
            return {
                R: colors[i].R,
                G: colors[i].G,
                B: colors[i].B,
            }
        }
    }
}

let colorGroup = [
    { name: 'white', hex: ['FFFFFF'] },
    { name: 'black', hex: ['000000'] },
    { name: 'grey light', hex: ['CCCCCC', 'DDDDDD', 'EEEEEE'] },
    { name: 'grey medium', hex: ['999999', 'AAAAAA', 'BBBBBB'] },
    { name: 'grey dark', hex: ['111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888'] },
    { name: 'red medium', hex: ['E31230', 'FF030D'] },
    { name: 'red light', hex: ['FF6F6F', 'FF6666', 'EE909F'] },
    { name: 'red dark', hex: ['660000', '8B0000', '99182C', '55141C'] },
    { name: 'red bright', hex: ['E60000', 'FF0000'] },
    { name: 'orange medium', hex: ['FF5B09', 'FF6600', 'FB861A', 'FE7E00', 'FF952B'] },
    { name: 'orange light', hex: ['FF7F50', 'FFB872', 'FFC388'] },
    { name: 'orange dark', hex: ['EE4000', 'E76021'] },
    { name: 'orange bright', hex: ['FF6103', 'FFAF4D'] },
    { name: 'yellow medium', hex: ['FFDB58'] },
    { name: 'yellow light', hex: ['FFEA9F', 'FFFFBE', 'FFFFD5'] },
    { name: 'yellow dark', hex: ['FFCC11'] },
    { name: 'yellow bright', hex: ['FFFF2A', 'FFFF2B', 'FFFF41', 'FFFF00'] },
    { name: 'green medium', hex: ['6EFF70', '39F55A', '43DD62', '3EA055', '66CDAA'] },
    { name: 'green light', hex: ['DFF2AE', 'EBF7CC', 'DAE9B0', 'C9FF93', 'BFEADC'] },
    { name: 'green dark', hex: ['7B7922', '4F4F2F', '414F12', '385E0F', '3B5323', '4C7064'] },
    { name: 'green bright', hex: ['7EFE00', '7CFC00', '7FFF00', '00FF00'] },
    { name: 'cyan medium', hex: ['00EEEE'] },
    { name: 'cyan light', hex: ['B1FFFF', 'CBFFFF', 'C9FFFF', '9DE1FF'] },
    { name: 'cyan dark', hex: ['008B8B', '00CDCD', '38B0DE', '1D88EA'] },
    { name: 'cyan bright', hex: ['41FFFF', '3ABEFE'] },
    { name: 'blue medium', hex: ['2385E6', '1E90FF', '4E9FFE', '0276FD', '0147FA'] },
    { name: 'blue light', hex: ['86BCF1', 'A4CEF8', 'A3D2FF', '71B3FF', '5F90D0'] },
    { name: 'blue dark', hex: ['104E8B', '003F87', '2C5197'] },
    { name: 'blue bright', hex: ['0000FF', '0075FB'] },
    { name: 'purple medium', hex: ['3B4990', 'A020F0', 'DB4DFF', '9B30FF'] },
    { name: 'purple light', hex: ['9DA9E4', 'ADADEB', 'B2ABDA', 'C7BEFF', 'E0B8EB'] },
    { name: 'purple dark', hex: ['162252', '23238E', '120A8F', '4B0082', '660198', '91219E'] },
    { name: 'purple bright', hex: ['B533F3', 'C12FFF', 'FF09FF'] },
    { name: 'magenta medium', hex: ['CD00CD'] },
    { name: 'magenta light', hex: ['AD99FF'] },
    { name: 'magenta dark', hex: ['8B008B'] },
    { name: 'magenta bright', hex: ['EE00EE', 'FF00FF'] },
    { name: 'pink medium', hex: ['FF6EC7'] },
    { name: 'pink light', hex: ['F8A9A9', 'FFCCCC', 'ECC8EC', 'FFE2FF'] },
    { name: 'pink dark', hex: ['EE82EE', 'DB70DB'] },
    { name: 'pink bright', hex: ['FE00FE', 'FF09FF', 'FF1CAE'] },
    { name: 'brown medium', hex: ['BF6A30', 'D06F2F', 'AA5303'] },
    { name: 'brown light', hex: ['BD7645', 'DBB399'] },
    { name: 'brown dark', hex: ['5E2612', '8B2500', '5C3317', '603311', '8B4500'] },
];
// SETUP: Convert hex colors to RGB
let colors = [];
for (let group = 0; group < colorGroup.length; group++) {
    let hex = colorGroup[group].hex;
    for (let hexIndex = 0; hexIndex < hex.length; hexIndex++) {
        let n = parseInt(hex[hexIndex], 16);
        let R = (n >> 16) & 255;
        let G = (n >> 8) & 255;
        let B = n & 255;
        let name = colorGroup[group].name;
        colors.push({
            R: R,
            G: G,
            B: B,
            group: group,
            hexIndex: hexIndex,
            name: name,
        });
    }
}

Jimp.read('a.png', function (err, image) {
    if (err) {
        throw err;
    }
    // SETTINGS
    let startGeneration = 1;
    let endGeneration   = 6000;
    let vectorMax = 8; // how many vectors to consider when looking for a vector match
    // SETUP: colorGroup[] width and height
    let width = image.bitmap.width;
    let height = image.bitmap.height;
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
    function findNearestColorGroup(R, G, B) {
        let nearest = 99999;
        let group = 0;
        for (let i = 0; i < colors.length; i++) {
            let r = R - colors[i].R;
            let g = G - colors[i].G;
            let b = B - colors[i].B;
            let dist = r*r + g*g * b*b;
            if (dist < nearest) {
                nearest = dist;
                group = colors[i].group;
            }
        }
        return group;
    }
    // SETUP: 2D array for image
    let img = new Array(width);
    for (let i = 0; i < width; i++) {
        img[i] = new Array(height);
    }
    // console.log('Init colorGroup array ' + colorGroup.length);
    // SETUP: colorGroup[]
    for (let i = 0; i < colorGroup.length; i++) {
        colorGroup[i].center = { x: 0, y: 0 };
        colorGroup[i].pixIndex = [];
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
        let group = findNearestColorGroup(R, G, B);
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
        // DEBUG START: Check the color mapping by over-riding RGB with basic colors
        let g = getFirstColorInGroup(group);
        pix[pixNum].R = g.R;
        pix[pixNum].G = g.G;
        pix[pixNum].B = g.B;
        // DEBUG END
        colorGroup[group].pixIndex.push(pixNum);
        pixNum++;
    });
    // DEBUG: How many colors in each color group?
    for (let i = 0; i < colorGroup.length; i++) {
        console.log('Color Group ' + i + ' name ' + colorGroup[i].name + ' has ' + colorGroup[i].pixIndex.length + ' pixels');
    }
    // Iterate from startGeneration to endGeneration
    let lastAverageDistToCenter = 99999;
    let gen = startGeneration;
    while (gen <= endGeneration) {
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
                let div = 1 / count;
                colorGroup[i].center = {
                    x: Math.round(x * div),
                    y: Math.round(y * div),
                }
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
                    let x2 = g.center.x;
                    let y2 = g.center.y;
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
                // DEBUG: Test to see which pixels are getting swapped
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
        }
        // DEBUG: Show color group center with blue pixels
        for (let i = 0; i < colorGroup.length; i++) {
            if (colorGroup[i].pixIndex.length > 0) {
                let x = colorGroup[i].center.x;
                let y = colorGroup[i].center.y;
                let hex = Jimp.rgbaToInt(0, 0, 255, 255);
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
            let d = x * x + y * y;
            averageDistToCenter += d;
        }
        averageDistToCenter = averageDistToCenter / pix.length;
        if (averageDistToCenter < lastAverageDistToCenter) {
            lastAverageDistToCenter = averageDistToCenter;
            console.log('GENERATION ' + gen + ' dist ' + averageDistToCenter + ' IMPROVED!');
            image.write(`gen${gen}i.png`); // save
        } else {
            console.log('GENERATION ' + gen + ' dist ' + averageDistToCenter);
            image.write(`gen${gen}x.png`); // save
        }
        gen++;
    }
});
