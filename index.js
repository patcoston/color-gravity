let Jimp = require('jimp');

Jimp.read('a.png', function (err, image) {
    if (err)
        throw err;
    let size = 32; // 1 2 4 8 16 32 64 128 256
    let blocks = 256 / size; // per Red, Green or Blue
    let colorGroup = new Array(blocks * blocks * blocks);
    let width = image.bitmap.width;
    let height = image.bitmap.height;
    // create 2D array for image
    let img = new Array(width);
    for (let i = 0; i < width; i++) {
        img[i] = new Array(height);
    }
    console.log('Init colorGroup array ' + colorGroup.length);
    for (let i = 0; i < colorGroup.length; i++) {
        colorGroup[i] = {
            center: { x: 0, y: 0 },
            pixIndex: []
        };
    }
    // vector match - define which vectors can swap pix
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
    // directions for vectors
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
    function getPixVectors(pix) {
        for (let v = 0; v < 8; v++) {
            let x = pix.x + dir[v].x;
            let y = pix.y + dir[v].y;
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
            swapped: false,
            vectors: [],
            group: group,
        };
        colorGroup[group].pixIndex.push(pixNum);
        pixNum++;
    });
    let gen = 0;
    let generations = 5;
    while (gen < generations) {
        console.log('GENERATION: ' + gen);
        console.log('Calc center of each color group');
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
        console.log('Calc distance to color group center for each vector then sort by distance');
        // Calculate distance to color group center for each vector then sort by distance
        image.scan(0, 0, width, height, function (x, y, idx) {
            let n = img[x][y];
            let p = pix[n];
            getPixVectors(pix[n]);
            let g = colorGroup[p.group];
            let v = p.vectors;
            for (let i = 0; i < v.length; i++) {
                let x1 = v[i].x;
                let y1 = v[i].y;
                let x2 = g.centerX;
                let y2 = g.centerY;
                let x = x1 - x2;
                let y = y1 - y2;
                let d = Math.sqrt(x * x + y * y);
                v[i].distToCenter = d;
            }
            v.sort(function(a, b) { // sort by distToCenter ascending
                return a.distToCenter - b.distToCenter;
            });
        });
        console.log('Randomize order of pixels');
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
        console.log('Find vector matches and swap pixels');
        // Find vector matches and swap pixels
        for (let i = 0; i < pixOrder.length; i++) {
            let n1 = pixOrder[i].pixIndex;
            let p1 = pix[n1];
            // if pixel 1 has not been swapped yet
            if (!p1.swapped) {
                let v1 = p1.vectors;
                for (let j = 0; j < v1.length; j++) {
                    let x2 = v1[j].x;
                    let y2 = v1[j].y;
                    let n2 = img[x2][y2];
                    let p2 = pix[n2];
                    // if pixel 2 has not been swapped yet
                    if (!p2.swapped) {
                        let d1 = v1[j].dir; // dir of vector 1
                        let v2 = p2.vectors;
                        for (let k = 0; k < v2.length; k++) {
                            let d2 = v2[k].dir; // dir of vector 2
                            if (vectorMatch[d1][d2]) { // if vector 1 and 2 match
                                let x1 = p1.x;
                                let y1 = p1.y;
                                let tmp = img[x1][y1];
                                img[x1][y1] = img[x2][y2];
                                img[x2][y2] = tmp;
                                p1.swapped = true;
                                p2.swapped = true;
                            }
                        }
                    }
    
                }
            }
        }
        console.log('Output image with swapped pixels');
        // TODO: Output image with swapped pixels
        image.scan(0, 0, width, height, function (x, y, idx) {
            let n = img[x][y];
            let p = pix[n];
            let R = p.R;
            let G = p.G;
            let B = p.B;
            let A = p.A;
            let hex = Jimp.rgbaToInt(R, G, B, A);
            image.setPixelColor(hex, x, y);
        });
        image.write(`gen${gen}.png`); // save
        gen++;
    }
});
