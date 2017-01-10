!(function(){
'use strict';

    function render() {
        const sourceImage = document.getElementById('sourceImage');
        const sourceCanvas = document.getElementById('sourceCanvas');
        const destCanvas = document.getElementById('destCanvas');

        sourceCanvas.getContext('2d').drawImage(sourceImage, 0, 0);

        const depthMap = getDepthMapFromCanvas(sourceCanvas);
        const colors = generatePalette(10);

        const pixelData = generatePixelDataGather({
            width: destCanvas.width,
            height: destCanvas.height,
            depthMap: depthMap,
            colors: colors
        });

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

    function generatePixelData(opts) {
        const width = opts.width;
        const height = opts.height;
        const depthMap = opts.depthMap;
        const pixels = new Uint8ClampedArray(width * height * 4);

        for (let y = 0; y < height; y++) {
            const same = computeRow(depthMap[y]);

            for (let x = 0; x < width; x++) {
                const pixelOffset = (y * width * 4) + (x * 4);
                const rgba = opts.colors[Math.floor(Math.random() * opts.colors.length)];

                for (let i = 0; i < 4; i++) {
                    pixels[pixelOffset + i] = same[x] === x
                        ? rgba[i]
                        : pixels[(y * width * 4) + (same[x] * 4) + i];
                }
            }
        }

        return pixels;
    }

    function computeRow(depthMapRow) {
        const width = depthMapRow.length;
        const same = new Uint16Array(width);

        for (let x = 0; x < width; x++) {
            const z = depthMapRow[x];
            const sep = Math.round((1 - (MU * z)) * EYE_SEP / (2 - (MU * z)));
            const left = Math.round(x - sep / 2);
            const right = left + sep;

            if (left >= 0 && right < width) {
                same[right] = left;
            }

            if (same[x] === 0) {
                same[x] = x;
            }
        }

        return same;
    }

// ----------------------------------------------------------------------------

    function originalColor(x, y) {
        const M = 4294967296;
        const A = 1664525;
        const C = 1013904223;

        function next(seed) {
            return (A * seed + C) % M;
        }
        function value(seed) {
            return seed / M;
        }

        const fst = next(x ^ y);

        return [
            Math.floor(255*value(next(fst))),
            Math.floor(255*value(next(next(fst)))),
            Math.floor(255*value(fst)),
            255
        ];
    }

    function generatePixelDataGather(opts) {
        const width = opts.width;
        const height = opts.height;
        const depthMap = opts.depthMap;
        const pixels = new Uint8ClampedArray(width * height * 4);

        let maxSame = 0;

        for (let y = 0; y < height; y++) {
            const same = computeRowGather(depthMap[y]);

            const offsetLookup = x =>
                (y * width * 4) + (x * 4);

            for (let x = 0; x < width; x++) {
                let sameCounter = 0;
                let yy = x;
                while (same[yy] !== y) {
                    yy = same[yy];
                    sameCounter++;
                    if (sameCounter > 500) break;
                }
                if (sameCounter > maxSame) {
                    maxSame = sameCounter;
                }

                const oc = originalColor(x, y)

                for (let i = 0; i < 4; i++) {
                    pixels[offsetLookup(x) + i] = same[x] === x
                        ? oc[i]
                        : pixels[offsetLookup(same[x]) + i];
                }
            }
        }

        console.log(maxSame);

        return pixels;
    }

    function computeRowGather(depthMapRow) {
        const width = depthMapRow.length;
        const same = new Uint16Array(width);

        for (let x = 0; x < width; x++) {
            same[x] = computePixelGather(depthMapRow, x);
        }

        return same;
    }

    function computePixelGather(depthMapRow, x) {
        let result = x;

        for (let i = Math.floor(x - EYE_SEP / 4); i <= x; i++) {
            if (i < 0) continue;
            const z = depthMapRow[i];
            const sep = Math.round((1 - (MU * z)) * EYE_SEP / (2 - (MU * z)));
            const left = Math.round(i - sep / 2);
            const right = left + sep;

            if (left < 0) continue;
            if (right !== x) continue;

            return left;
            result = left;
        }

        return result;
    }

    setTimeout(render, 1000);

})();
