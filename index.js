let Jimp = require('jimp');
 
Jimp.read('input.png', function (err, image) {
    if (err) throw err;
    let width = image.bitmap.width
    let height = image.bitmap.height;
    // create 2D array for image
    let img = new Array(width);
    for (let i = 0; i < width; i++) {
        img[i] = new Array(height);
    }
    let pix = new Array(width * height);
    let dir = new Array(8);
    let n = 0;
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            if (x || y) {
                dir[n++] = { x: x, y: y };
            }
        }
    }
    function getPixVectors(pix) {
        let n = 0;
        for (let v = 0; v < 8; v++) {
            let x = pix.x + dir[v].x;
            let y = pix.y + dir[v].y;
            if ((x >= 0) && (y >= 0) && (x < width) && (y < height)) {
                pix.vectors[n++] = {
                    x: x,
                    y: y,
                }
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
        img[x][y] = pixNum;
        pix[pixNum] = {
            R: R,
            G: G,
            B: B,
            A: A,
            x: x,
            y: y,
            groupID: 0,
            swapped: false,
            distToCenter: 0,
            vectors: new Array(8),
            vectorCount: 0,
        }
        getPixVectors(pix[pixNum]);
        pixNum++;
    });
    let gen = 0;
    let generations = 10;
    while(gen < generations) {
        image.scan(0, 0, width, height, function (x, y, idx) {
            // x, y is the position of this pixel on the image
            // idx is the position start position of this rgba tuple in the bitmap Buffer
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
