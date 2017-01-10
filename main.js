!(function(){
'use strict';

    function render() {
        const sourceImage = document.getElementById('sourceImage');
        const sourceCanvas = document.getElementById('sourceCanvas');
        const destCanvas = document.getElementById('destCanvas');

        sourceCanvas.getContext('2d').drawImage(sourceImage, 0, 0);

        const depthMap = getDepthMapFromCanvas(sourceCanvas);
        const sameMap = computeFirstPass(depthMap);
        const pixelData = computePixels(sameMap);

        const destContext = destCanvas.getContext('2d'),
        imageData = destContext.createImageData(destCanvas.width, destCanvas.height);
        imageData.data.set(pixelData);
        destContext.putImageData(imageData, 0, 0);

        sourceImage.style.display = 'none';
        sourceCanvas.style.display = 'none';
    }

    function generatePalette(numColors) {
        const palette = [];
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
        const context = canvas.getContext('2d');
        const depthMap = [];
        const pixelData = context.getImageData(0, 0, canvas.width, canvas.height).data;

        for (let y = 0; y < canvas.height; y++) {
            depthMap[y] = new Float32Array(canvas.width);
            const offset = canvas.width * y * 4;
            for (let x = 0; x < canvas.width; x++) {
                depthMap[y][x] = 1 - pixelData[offset + (x * 4)] / 255;
            }
        }

        return depthMap;
    }

// ----------------------------------------------------------------------------

    const DPI = 72; // assuming output of 72 dots per inch
    const EYE_SEP = Math.round(2.5 * DPI); // eye separation assumed to be 2.5 inches
    const MU = (1 / 2); // depth of field

// ----------------------------------------------------------------------------

    function originalColor(x, y) {
        const M = 4294967296;
        const A = 1664525;
        const C = 1013904223;
        function next(seed) { return (A * seed + C) % M; }
        function value(seed) { return seed / M; }
        const fst = next(x ^ y);
        return [
            Math.floor(255*value(next(fst))),
            Math.floor(255*value(next(next(fst)))),
            Math.floor(255*value(fst)),
            255
        ];
    }

    function computePixels(sameMap) {
        const width = sameMap[0].length;
        const height = sameMap.length;
        const pixels = new Uint8ClampedArray(width * height * 4);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let ox = x;
                for (let i = 0; i < 20; ++i) {
                    if (sameMap[y][ox] === ox) break;
                    ox = sameMap[y][ox];
                }

                const col = originalColor(ox, y);
                pixels[(y * width * 4) + (x * 4) + 0] = col[0];
                pixels[(y * width * 4) + (x * 4) + 1] = col[1];
                pixels[(y * width * 4) + (x * 4) + 2] = col[2];
                pixels[(y * width * 4) + (x * 4) + 3] = col[3];
            }
        }

        return pixels;
    }

    function computeFirstPass(depthMap) {
        const width = depthMap[0].length;
        const height = depthMap.length;
        const sameMap = new Array(height);

        for (let y = 0; y < height; y++) {
            sameMap[y] = new Array(width);
            for (let x = 0; x < width; x++) {
                sameMap[y][x] = x;

                for (let it = -Math.floor(EYE_SEP / 4); it <= 0; it++) {
                    const i = x + it;
                    if (i < 0) continue;
                    const z = depthMap[y][x];
                    const sep = Math.round((1 - (MU * z)) * EYE_SEP / (2 - (MU * z)));
                    const left = Math.round(i - sep / 2);
                    const right = left + sep;

                    if (left < 0) continue;
                    if (right !== x) continue;

                    sameMap[y][x] = left;
                    break;
                }
            }
        }

        return sameMap;
    }

    setTimeout(render, 1000);

})();
