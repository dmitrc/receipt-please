const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const ce = e => document.createElement(e);

const maxW = 384;
const maxH = 5000;
const cursorAllowance = 2;

let curY = 0;
let curH = 0;
let isDrawingMode = false;
let isDrawing = false;
let mouse = { x: 0, y: 0 };
let lastMouse = { x: 0, y: 0};

const preview = $('.preview');
const canvasWrapper = $('#previewWrap');
const canvas = $('#previewCanvas');
const previewCursor = $('#previewCursor');
const previewHeight = $('#previewHeight');
const printBtn = $('#printBtn');
const clearBtn = $('#clearBtn');
const textBox = $('#textBox');
const fontBox = $('#fontBox');
const sizeBox = $('#sizeBox');
const textBtn = $('#textBtn');
const listBtn = $('#listBtn');
const marginBox = $('#marginBox');
const marginBtn = $('#marginBtn');
const imageBox = $('#imageBox');
const dithAlgo = $('#dithAlgo');
const imageBtn = $('#imageBtn');
const drawStartBtn = $('#drawStartBtn');
const drawEndBtn = $('#drawEndBtn');
const brushBox = $('#brushBox');

const ctx = canvas.getContext('2d');
canvas.width = maxW;
canvas.height = maxH;

/* Misc helpers */

function def(x, d) {
    return typeof(x) == 'undefined' ? d : x;
}

/* State helpers */

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
    const scale = canvas.width / canvasWrapper.clientWidth;

    previewCursor.style.top = `${curY / scale}px`;
    previewHeight.style.top = `${curH / scale}px`;

    const wrapperHeight = Math.max(preview.clientHeight, (curH / scale) + cursorAllowance);
    canvasWrapper.style.maxHeight = `${wrapperHeight}px`;
}

/* Render helpers */

function renderText(text, settings) {
    settings = settings || {};

    let y = def(settings.y, curY);
    const x = def(settings.x, 0);
    const w = def(settings.w, maxW);
    const fontName = def(settings.fontName, 'Arial');
    const fontSize = def(settings.fontSize, 28);
    const lineHeightRatio = def(settings.lineHeightRatio, 1.2);
    const useSpace = def(settings.useSpace, true);
    const updateHeight = def(settings.updateHeight, true)

    ctx.font = `${fontSize}px ${fontName}`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'black';
    
    const lineHeight = Math.ceil(fontSize * lineHeightRatio);
    const paragraphs = text.split('\n');
    let line = '';

    for (let i = 0; i < paragraphs.length; i++) {
	    const breakChar = useSpace ? ' ' : '';
        const words = paragraphs[i].split(breakChar);

        for (let n = 0; n < words.length; n++)
        {
            const testLine = line + words[n] + breakChar;
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

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

function ditherImage(imageCanvas, imageCtx) {
    const opts = {
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

    const w = imageCanvas.width;
    const h = imageCanvas.height;

    const q = new RgbQuant(opts);

    const ditherResult = q.reduce(imageCanvas);

    const imgData = imageCtx.getImageData(0, 0, w, h);
    imgData.data.set(ditherResult);
    imageCtx.putImageData(imgData, 0, 0);

    return imageCanvas;
}

function renderImage(image, settings) {
    settings = settings || {};

    const x = def(settings.x, 0);
    const y = def(settings.y, curY);
    const updateHeight = def(updateHeight, true);

    const w = image.width;
    const h = image.height;

    const adjustedW = maxW;
    const adjustedH = h * (adjustedW / w);

    const imageCanvas = ce('canvas');
    imageCanvas.width = adjustedW;
    imageCanvas.height = adjustedH;

    const imageCtx = imageCanvas.getContext('2d');
    imageCtx.drawImage(image, 0, 0, adjustedW, adjustedH);

    const ditheredImage = ditherImage(imageCanvas, imageCtx);
    ctx.drawImage(ditheredImage, x, y);

    const newH = (y + adjustedH);
    updateHeight && setCurrentHeight(newH);
    return newH;
}

function renderListItem(text, settings) {
    settings = settings || {};

    const y = def(settings.y, curY);
    const fontName = def(settings.fontName, 'Arial');
    const fontSize = def(settings.fontSize, 28);
    const iconSize = def(settings.iconSize, 32);
    const lineHeightRatio = def(settings.lineHeightRatio, 1.2);
    const useSpace = def(settings.useSpace, true);
    const updateHeight = def(settings.updateHeight, true)

    const h1 = renderText('☐', {
        fontName: 'Arial',
        fontSize: iconSize,
        lineHeight: 1.0,
        updateHeight: false
    });

    const h2 = renderText(text, { 
        x: 40,
        w: maxW - 40,
        fontName: fontName,
        fontSize: fontSize,
        lineHeightRatio: lineHeightRatio,
        useSpace: useSpace,
        updateHeight: false
    });

    const newH = Math.max(h1, h2);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, newH, maxW, 1);
    ctx.fillStyle = 'black';

    newH += 9;
    updateHeight && setCurrentHeight(newH);
    return newH;
}

/* Draw mode helpers */

function startDraw(x, y) {
    if (isDrawingMode) {
        const canvas = {
            x: preview.offsetLeft,
            y: preview.offsetTop - preview.scrollTop
        };

        lastMouse.x = mouse.x = parseInt(x - canvas.x);
	    lastMouse.y = mouse.y = parseInt(y - canvas.y);
        isDrawing = true
    }
}

function endDraw() {
    if (isDrawingMode) {
        isDrawing = false;
    }
}

function moveDraw(x, y) {
    const c = {
        x: preview.offsetLeft,
        y: preview.offsetTop - preview.scrollTop,
        scale: canvas.width / canvasWrapper.clientWidth
    };

    mouse.x = parseInt(x - c.x);
    mouse.y = parseInt(y - c.y);

    if (isDrawingMode && isDrawing) {
        let lineWidth = parseInt(brushBox.value);
        if (isNaN(lineWidth)) {
            lineWidth = 2;
        }

        ctx.strokeStyle = 'black';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = lineWidth;

        const scaledLastMouse = { 
            x: lastMouse.x * c.scale,
            y: lastMouse.y * c.scale
        };

        const scaledMouse = { 
            x: mouse.x * c.scale,
            y: mouse.y * c.scale
        };

        ctx.beginPath();
        ctx.moveTo(scaledLastMouse.x, scaledLastMouse.y);
        ctx.lineTo(scaledMouse.x, scaledMouse.y);
        ctx.closePath();
        ctx.stroke();

        const halfLineWidth = Math.ceil(lineWidth / 2);
        if (scaledMouse.y + halfLineWidth > curH) {
            setCurrentHeight(scaledMouse.y + halfLineWidth);
        }

        lastMouse.x = mouse.x;
        lastMouse.y = mouse.y;
    }
}

/* Canvas primary actions */

function print(trimH = curH) {
    const exportData = ctx.getImageData(0, 0, maxW, trimH);

    const exportCanvas = ce('canvas');
    exportCanvas.width = maxW;
    exportCanvas.height = trimH;
    
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.putImageData(exportData, 0, 0);
    
    exportCanvas.toBlob(blob => {
        const formData = new FormData();
        formData.append('blob', blob);

        const opts = {
            method: 'POST',
            body: formData
        };

        fetch('/print', opts)
            .then(res => console.log)
            .catch(err => console.error);
    });
}

function clear() {
    ctx.fillStyle = '#fff';
    if (curY < curH) {
        ctx.fillRect(0, curY, maxW, curH - curY);
        setCurrentHeight(curY, true);
    }
    else {
        ctx.fillRect(0, 0, maxW, curH);
        setCurrentHeight(0, true);
    }
}

/* Button handlers */

function addText() {
    const text = textBox.value;
    if (text) {
        const fontSetting = fontBox.value || undefined;
        const sizeSetting = parseInt(sizeBox.value);
        
        if (isNaN(sizeSetting)) {
            sizeSetting = undefined;
        }

        renderText(text, { fontName: fontSetting, fontSize: sizeSetting });

        textBox.value = '';
        textBox.focus();
    }
}

function addList() {
    const text = textBox.value;
    if (text) {
        const fontSetting = fontBox.value || undefined;
        const sizeSetting = parseInt(sizeBox.value);
        
        if (isNaN(sizeSetting)) {
            sizeSetting = undefined;
        }

        items = text.split('\n');
        for (const item of items) {
            renderListItem(item, { fontName: fontSetting, fontSize: sizeSetting });
        }

        textBox.value = '';
        textBox.focus();
    }
}

function addMargin() {
    const marginSetting = parseInt(marginBox.value);
    if (!isNaN(marginSetting)) {
        setCurrentHeight(curY + marginSetting);
    }
}

function addImage() {
    const files = imageBox.files;
    if (files.length > 0) {
        const file = files[0];

        const img = new Image();
        img.onload = () => {
            renderImage(img);
            URL.revokeObjectURL(file);
        }

        img.src = URL.createObjectURL(file);
    }
}

function enableDraw() {
    isDrawingMode = true;
    canvas.classList.add('draw');
    drawStartBtn.classList.add('hide');
    drawEndBtn.classList.remove('hide');
}

function disableDraw() {
    isDrawingMode = false;
    canvas.classList.remove('draw');
    drawEndBtn.classList.add('hide');
    drawStartBtn.classList.remove('hide');
}

/* Section handlers */

function toggleSection(button) {
    const section = button.parentElement;
    section.classList.toggle('expanded');
}

/* Setup */

function addHandlers() {
    window.onresize = () => updateCursors();

    printBtn.onclick = () => print();
    clearBtn.onclick = () => clear();
    textBtn.onclick = () => addText();
    marginBtn.onclick = () => addMargin();
    imageBtn.onclick = () => addImage();
    drawStartBtn.onclick = () => enableDraw();
    drawEndBtn.onclick = () => disableDraw();

    const sectionButtons = $$('.section-btn');
    for (const button of sectionButtons) {
        button.onclick = () => toggleSection(button);
    }

    canvas.onmousedown = (e) => {
        startDraw(e.pageX, e.pageY);
    }
    
    canvas.ontouchstart = (e) => {
        const touch = e.touches[0];
        startDraw(touch.pageX, touch.pageY);
    }
    
    canvas.onmouseup = () => endDraw();
    canvas.ontouchend = () => endDraw();
    canvas.ontouchcancel = () => endDraw();
    
    canvas.onmousemove = (e) => {
        moveDraw(e.pageX, e.pageY);
    }
    
    canvas.ontouchmove = (e) => {
        const touch = e.touches[0];
        moveDraw(touch.pageX, touch.pageY);
    }
}

addHandlers();