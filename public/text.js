const $ = (s, e) => (e || document).querySelector(s);
const $$ = (s, e) => (e || document).querySelectorAll(s);
const ce = e => document.createElement(e);

const textEndpoint = 'http://localhost:3000/text';
const maxW = 384;
const maxH = 5000;
const cursorAllowance = 2;

let curY = 0;
let curH = 0;
let textBuffer = "";

const preview = $('.preview');
const canvasWrapper = $('#previewWrap');
const canvas = $('#previewCanvas');
const previewCursor = $('#previewCursor');
const previewHeight = $('#previewHeight');
const printBtn = $('#printBtn');
const clearBtn = $('#clearBtn');
const textBox = $('#textBox');
const textBtn = $('#textBtn');
const ctx = canvas.getContext('2d');
canvas.width = maxW;
canvas.height = maxH;

ctx.fillStyle = 'white';
ctx.fillRect(0, 0, maxW, maxH);

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
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';
    
    const lineHeight = fontSize * lineHeightRatio;
    const paragraphs = text.split('\n');
    let line = '';

    y += lineHeight / 2;

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

    y -= lineHeight / 2;

    updateHeight && setCurrentHeight(y);
    return y;
}

/* Canvas primary actions */

function print() {
    if (!textBuffer) {
        return;
    }

    const opts = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            text: textBuffer 
        })
    };

    fetch(textEndpoint, opts)
        .then(res => console.log)
        .catch(err => console.error);
}

function clear() {
    ctx.fillStyle = 'white';
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
    let text = textBox.value;
    if (text) {
        const settings = {
            fontName: 'Arial', 
            fontSize: 24,
            lineHeightRatio: 1,
            useSpace: false,
            x: 15,
            w: 359
        };

        text += "\n\n";

        textBuffer += text;
        renderText(text, settings);

        textBox.value = '';
        textBox.focus();
    }
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

    const sectionButtons = $$('.section-btn');
    for (const button of sectionButtons) {
        button.onclick = () => toggleSection(button);
    }
}

addHandlers();