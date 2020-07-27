const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

var maxW = 384;
var maxH = 5000;
var curY = 0;
var curH = 0;

var canvasWrapper = $('#previewWrap');

var canvas = $('#previewCanvas');
var ctx = canvas.getContext('2d');
canvas.width = maxW;
canvas.height = maxH;

var cursorAllowance = 2;
var previewCursor = $('#previewCursor');
var previewHeight = $('#previewHeight');
function setCurrentHeight(y, force = false) {
    y = Math.max(y, 0);
    y = Math.min(canvas.height, y);

    curY = y;

    if (force) {
        curH = y;
    }
    else {
        curH = Math.max(curH, y);
    }

    updateCursors();
}

function updateCursors() {
    var scale = canvas.width / canvasWrapper.clientWidth;

    previewCursor.style.top = `${curY / scale}px`;
    previewHeight.style.top = `${curH / scale}px`;

    var wrapperHeight = Math.max(preview.clientHeight, (curH / scale) + cursorAllowance);
    canvasWrapper.style.maxHeight = `${wrapperHeight}px`;
}

function def(x, d) {
    return typeof(x) == 'undefined' ? d : x;
}

function wrapText(text, settings) {
    settings = settings || {};

    var x = def(settings.x, 0);
    var y = def(settings.y, curY);
    var w = def(settings.w, maxW);
    var fontName = def(settings.fontName, 'Arial');
    var fontSize = def(settings.fontSize, 28);
    var lineHeightRatio = def(settings.lineHeightRatio, 1.2);
    var useSpace = def(settings.useSpace, true);
    var updateHeight = def(settings.updateHeight, true)

    ctx.font = `${fontSize}px ${fontName}`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'black';
    
    var lineHeight = Math.ceil(fontSize * lineHeightRatio);
    var paragraphs = text.split('\n');
    var line = '';

    for (var i = 0; i < paragraphs.length; i++) {
	    var breakChar = useSpace ? ' ' : '';
        var words = paragraphs[i].split(breakChar);

        for (var n = 0; n < words.length; n++)
        {
            var testLine = line + words[n] + breakChar;
            var metrics = ctx.measureText(testLine);
            var testWidth = metrics.width;

            if (testWidth > w && n > 0)
            {
                ctx.fillText(line, x, y);
                line = words[n] + breakChar;
                y += lineHeight;
            }
            else
            {
                line = testLine;
            }
        }

        ctx.fillText(line, x, y);
        y += lineHeight;
        line = '';
    }

    updateHeight && setCurrentHeight(y);
    return y;
}

var dithAlgo = $('#dithAlgo');
function ditherImage(imageCanvas, imageCtx) {
    var opts = {
        colors: 2,
        method: 2,
        boxSize: [8, 8],
        boxPxls: 2000,
        initColors: 4096,
        minHueCols: 0,
        dithKern: dithAlgo.value,
        dithDelta: 0,
        dithSerp: false,
        palette: [ [0, 0, 0], [255, 255, 255] ],
        reIndex: false,
        useCache: false,
        cacheFreq: 10,
        colorDist: 'euclidean'
    };

    var w = imageCanvas.width;
    var h = imageCanvas.height;

    var q = new RgbQuant(opts);

    var ditherResult = q.reduce(imageCanvas);

    var imgData = imageCtx.getImageData(0, 0, w, h);
    imgData.data.set(ditherResult);
    imageCtx.putImageData(imgData, 0, 0);

    return imageCanvas;
}

function drawImage(image, settings) {
    settings = settings || {};

    var x = def(settings.x, 0);
    var y = def(settings.y, curY);
    var updateHeight = def(updateHeight, true);

    var w = image.width;
    var h = image.height;

    var adjustedW = maxW;
    var adjustedH = h * (adjustedW / w);

    var imageCanvas = document.createElement('canvas');
    imageCanvas.width = adjustedW;
    imageCanvas.height = adjustedH;

    var imageCtx = imageCanvas.getContext('2d');
    imageCtx.drawImage(image, 0, 0, adjustedW, adjustedH);

    var ditheredImage = ditherImage(imageCanvas, imageCtx);
    ctx.drawImage(ditheredImage, x, y);

    var newH = (y + adjustedH);
    updateHeight && setCurrentHeight(newH);
    return newH;
}

function addListItem(text, settings) {
    settings = settings || {};

    var y = def(settings.y, curY);
    var fontName = def(settings.fontName, 'Arial');
    var fontSize = def(settings.fontSize, 28);
    var iconSize = def(settings.iconSize, 32);
    var lineHeightRatio = def(settings.lineHeightRatio, 1.2);
    var useSpace = def(settings.useSpace, true);
    var updateHeight = def(settings.updateHeight, true)

    var h1 = wrapText('☐', {
        fontName: 'Arial',
        fontSize: iconSize,
        lineHeight: 1.0,
        updateHeight: false
    });

    var h2 = wrapText(text, { 
        x: 40,
        w: maxW - 40,
        fontName: fontName,
        fontSize: fontSize,
        lineHeightRatio: lineHeightRatio,
        useSpace: useSpace,
        updateHeight: false
    });

    var newH = Math.max(h1, h2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, newH, maxW, 1);
    ctx.fillStyle = 'black';

    newH += 9;
    updateHeight && setCurrentHeight(newH);
    return newH;
}

function printBlob(blob) {
    const formData = new FormData();
    formData.append('blob', blob);

    const opts = {
        method: 'POST',
        body: formData
    };

    fetch('/print', opts)
        .then(res => console.log)
        .catch(err => console.error);
}

function generateAndPrintBlob(trimH = curH) {
    const exportData = ctx.getImageData(0, 0, maxW, trimH);

    var exportCanvas = document.createElement('canvas');
    exportCanvas.width = maxW;
    exportCanvas.height = trimH;
    
    var exportCtx = exportCanvas.getContext('2d');
    exportCtx.putImageData(exportData, 0, 0);
    
    exportCanvas.toBlob(blob => {
        printBlob(blob);
    });
}

var printBtn = $('#printBtn');
printBtn.onclick = () => {
    generateAndPrintBlob();
};

var clearBtn = $('#clearBtn');
clearBtn.onclick = () => {
    ctx.fillStyle = '#fff';
    if (curY < curH) {
        ctx.fillRect(0, curY, maxW, curH - curY);
        setCurrentHeight(curY, true);
    }
    else {
        ctx.fillRect(0, 0, maxW, curH);
        setCurrentHeight(0, true);
    }
};

var textBox = $('#textBox');
var fontBox = $('#fontBox');
var sizeBox = $('#sizeBox');

var textBtn = $('#textBtn');
textBtn.onclick = () => {
    var text = textBox.value;
    if (text) {
        var fontSetting = fontBox.value || undefined;
        var sizeSetting = parseInt(sizeBox.value);
        
        if (isNaN(sizeSetting)) {
            sizeSetting = undefined;
        }

        wrapText(text, { fontName: fontSetting, fontSize: sizeSetting });

        textBox.value = '';
        textBox.focus();
    }
};

var listBtn = $('#listBtn');
listBtn.onclick = () => {
    var text = textBox.value;
    if (text) {
        var fontSetting = fontBox.value || undefined;
        var sizeSetting = parseInt(sizeBox.value);
        
        if (isNaN(sizeSetting)) {
            sizeSetting = undefined;
        }

        items = text.split('\n');
        for (var item of items) {
            addListItem(item, { fontName: fontSetting, fontSize: sizeSetting });
        }

        textBox.value = '';
        textBox.focus();
    }
};

var marginBox = $('#marginBox');

var marginBtn = $('#marginBtn');
marginBtn.onclick = () => {
    var marginSetting = parseInt(marginBox.value);
    if (!isNaN(marginSetting)) {
        setCurrentHeight(curY + marginSetting);
    }
};

var imageBox = $('#imageBox');
var imageBtn = $('#imageBtn');
imageBtn.onclick = () => {
    var files = imageBox.files;
    if (files.length > 0) {
        var file = files[0];

        var img = new Image();
        img.onload = () => {
            drawImage(img);
            URL.revokeObjectURL(file);
        }

        img.src = URL.createObjectURL(file);
    }
};

var isDrawingMode = false;
var isDrawing = false;

var mouse = { x: 0, y: 0 };
var lastMouse = { x: 0, y: 0};

var preview = document.querySelector('.preview');
var drawStartBtn = $('#drawStartBtn');
drawStartBtn.onclick = () => {
    isDrawingMode = true;

    canvas.classList.add('draw');
    drawStartBtn.classList.add('hide');
    drawEndBtn.classList.remove('hide');

    if (curH < preview.clientHeight) {
        canvasWrapper.style.maxHeight = `${preview.clientHeight}px`;
    }
};

var drawEndBtn = $('#drawEndBtn');
drawEndBtn.onclick = () => {
    isDrawingMode = false;

    canvas.classList.remove('draw');
    drawEndBtn.classList.add('hide');
    drawStartBtn.classList.remove('hide');
};

canvas.onmousedown = (e) => {
    if (isDrawingMode) {
        var canvas = {
            x: preview.offsetLeft,
            y: preview.offsetTop - preview.scrollTop
        };

        lastMouse.x = mouse.x = parseInt(e.pageX-canvas.x);
	    lastMouse.y = mouse.y = parseInt(e.pageY-canvas.y);
        isDrawing = true
    }
}

canvas.ontouchstart = (e) => {
    if (isDrawingMode) {
        var canvas = {
            x: preview.offsetLeft,
            y: preview.offsetTop - preview.scrollTop
        };

        var touch = e.targetTouches[0];

        lastMouse.x = mouse.x = parseInt(touch.pageX-canvas.x);
	    lastMouse.y = mouse.y = parseInt(touch.pageY-canvas.y);
        isDrawing = true
    }
}

canvas.onmouseup = (e) => {
    if (isDrawingMode) {
        isDrawing = false;
    }
}

canvas.ontouchend = (e) => {
    if (isDrawingMode) {
        isDrawing = false;
    }
}

canvas.ontouchcancel = (e) => {
    if (isDrawingMode) {
        isDrawing = false;
    }
}

canvas.onmousemove = (e) => {
    var c = {
        x: preview.offsetLeft,
        y: preview.offsetTop - preview.scrollTop,
        scale: canvas.width / canvasWrapper.clientWidth
    };

    mouse.x = parseInt(e.pageX - c.x);
    mouse.y = parseInt(e.pageY - c.y);

    if (isDrawingMode && isDrawing) {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        var scaledLastMouse = { 
            x: lastMouse.x * c.scale,
            y: lastMouse.y * c.scale
        };

        var scaledMouse = { 
            x: mouse.x * c.scale,
            y: mouse.y * c.scale
        };

        ctx.beginPath();
        ctx.moveTo(scaledLastMouse.x, scaledLastMouse.y);
        ctx.lineTo(scaledMouse.x, scaledMouse.y);
        ctx.closePath();
        ctx.stroke();

        if (scaledMouse.y > curH) {
            setCurrentHeight(scaledMouse.y + 2);
        }

        lastMouse.x = mouse.x;
        lastMouse.y = mouse.y;
    }
}

canvas.ontouchmove = (e) => {
    var c = {
        x: preview.offsetLeft,
        y: preview.offsetTop - preview.scrollTop,
        scale: canvas.width / canvasWrapper.clientWidth
    };

    var touch = e.targetTouches[0];

    mouse.x = parseInt(touch.pageX - c.x);
    mouse.y = parseInt(touch.pageY - c.y);

    if (isDrawingMode && isDrawing) {
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        var scaledLastMouse = { 
            x: lastMouse.x * c.scale,
            y: lastMouse.y * c.scale
        };

        var scaledMouse = { 
            x: mouse.x * c.scale,
            y: mouse.y * c.scale
        };

        ctx.beginPath();
        ctx.moveTo(scaledLastMouse.x, scaledLastMouse.y);
        ctx.lineTo(scaledMouse.x, scaledMouse.y);
        ctx.closePath();
        ctx.stroke();

        if (scaledMouse.y > curH) {
            setCurrentHeight(scaledMouse.y + 2);
        }

        lastMouse.x = mouse.x;
        lastMouse.y = mouse.y;

        e.preventDefault();
    }
}

window.onresize = () => {
    updateCursors();
}