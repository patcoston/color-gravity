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
            center: { R: 0, G: 0, B: 0 },
            pixIndex: []
        };
    }
    let pix = new Array(width * height);
    let n = 0;
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
        let n = 0;
        for (let v = 0; v < 8; v++) {
            let x = pix.x + dir[v].x;
            let y = pix.y + dir[v].y;
            if ((x >= 0) && (y >= 0) && (x < width) && (y < height)) {
                pix.vectors[n++] = {
                    x: x,
                    y: y,
                };
            }
        }
        pix.vectorCount = n;
    }
    let pixNum = 0;
    image.scan(0, 0, width, height, function (x, y, idx) {
        // x, y is the position of this pixel on the image
        // idx is the position start position of this rgba tuple in the bitmap Buffer
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
            distToCenter: 0,
            vectors: new Array(8),
            vectorCount: 0,
            group: group,
        };
        colorGroup[group].pixIndex.push(pixNum);
        pixNum++;
    });
    let gen = 0;
    let generations = 5;
    while (gen < generations) {
        // Calculate center of each color group
        for (let i = 0; i < colorGroup.length; i++) {
            if (colorGroup[i].pixIndex.length > 0) {
                let R = 0;
                let G = 0;
                let B = 0;
                let count = colorGroup[i].pixIndex.length;
                for (let j = 0; j < count; j++) {
                    let n = colorGroup[i].pixIndex[j];
                    let p = pix[n];
                    R += p.R;
                    G += p.G;
                    B += p.B;
                }
                colorGroup[i].center = {
                    R: Math.round(R / count),
                    G: Math.round(G / count),
                    B: Math.round(B / count),
                }
            }
        }
        // TODO: Calculate distance to each vector then sort by distance
        image.scan(0, 0, width, height, function (x, y, idx) {
            let n = img[x][y];
            let p = pix[n];
            getPixVectors(pix[n]);

        });
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
