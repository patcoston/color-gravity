var Jimp = require("jimp");
 
Jimp.read("lenna.png", function (err, image) {
    if (err) throw err;
    var width = image.bitmap.width
    var height = image.bitmap.height;
    // create 2D array for image
    var img = new Array(width);
    for (var i = 0; i < width; i++) {
        img[i] = new Array(height);
    }
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        // x, y is the position of this pixel on the image
        // idx is the position start position of this rgba tuple in the bitmap Buffer
        var R = this.bitmap.data[idx];
        var G = this.bitmap.data[idx + 1];
        var B = this.bitmap.data[idx + 2];
        var A = this.bitmap.data[idx + 3];

        var hex = Jimp.rgbaToInt(255, 255, 255, A);
        image.setPixelColor(hex, x, y);
    });
    image.write("lena-white.png"); // save
});
