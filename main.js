!(function(){
'use strict';

    function render() {
        let sourceImage = document.getElementById('sourceImage');
        let sourceCanvas = document.getElementById('sourceCanvas');
        let destCanvas = document.getElementById('destCanvas');

        sourceCanvas.getContext('2d').drawImage(sourceImage, 0, 0);

        let depthMap = getDepthMapFromCanvas(sourceCanvas);
        let colors = generatePalette(10);

        let pixelData = generatePixelData({
            width: destCanvas.width,
            height: destCanvas.height,
            depthMap: depthMap,
            colors: colors
        });

        let destContext = destCanvas.getContext('2d'),
        imageData = destContext.createImageData(destCanvas.width, destCanvas.height);
        imageData.data.set(pixelData);
        destContext.putImageData(imageData, 0, 0);

        sourceImage.style.display = 'none';
        sourceCanvas.style.display = 'none';
    }

    function generatePalette(numColors) {
        let palette = [];
        for (let i = 0; i < numColors; i++) {
            palette.push([Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256),
                255
            ]);
        }
        return palette;
    }

    function getDepthMapFromCanvas(canvas) {
        let context = canvas.getContext('2d');
        let depthMap = [];
        let pixelData = context.getImageData(0, 0, canvas.width, canvas.height).data;

        for (let y = 0; y < canvas.height; y++) {
            depthMap[y] = new Float32Array(canvas.width);
            let offset = canvas.width * y * 4;
            for (let x = 0; x < canvas.width; x++) {
                depthMap[y][x] = 1 - pixelData[offset + (x * 4)] / 255;
            }
        }

        return depthMap;
    }

    const DPI = 72; // assuming output of 72 dots per inch
    const EYE_SEP = Math.round(2.5 * DPI); // eye separation assumed to be 2.5 inches
    const MU = (1 / 3); // depth of field (fraction of viewing distance)

    function generatePixelData(opts) {
        let width = opts.width;
        let height = opts.height;
        let depthMap = opts.depthMap;
        let pixels = new Uint8ClampedArray(width * height * 4);

        for (let y = 0; y < height; y++) {
            let same = new Uint16Array(width);

            for (let x = 0; x < width; x++) {
                same[x] = x;
            }

            for (let x = 0; x < width; x++) {
                let z = depthMap[y][x];

                let sep = Math.round((1 - (MU * z)) * EYE_SEP / (2 - (MU * z)));
                let left = Math.round(x - ((sep + (sep & y & 1)) / 2));
                let right = left + sep;

                if (0 <= left && right < width) {
                    let t = 1;
                    let zt = 0;
                    let visible = true;

                    do {
                        zt = z + (2 * (2 - (MU * z)) * t / (MU * EYE_SEP));
                        visible = (depthMap[y][x-t] < zt) && (depthMap[y][x+t] < zt);
                        t++;
                    } while (visible && zt < 1);

                    if (visible) {
                        for (let k = same[left]; k !== left && k !== right; k = same[left]) {
                            if (k < right) {
                                left = k;
                            } else {
                                left = right;
                                right = k;
                            }
                        }
                        same[left] = right;
                    }
                }
            }

            for (let x = (width - 1); x >= 0; x--) {
                let pixelOffset = (y * width * 4) + (x * 4);
                let rgba = opts.colors[Math.floor(Math.random() * opts.colors.length)];

                for (let i = 0; i < 4; i++) {
                    pixels[pixelOffset + i] = same[x] === x
                        ? rgba[i]
                        : pixels[(y * width * 4) + (same[x] * 4) + i];
                }
            }
        }

        return pixels;
    }

    setTimeout(render, 1000);

})();
