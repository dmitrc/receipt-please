const $ = (s, e) => (e || document).querySelector(s);
const $$ = (s, e) => (e || document).querySelectorAll(s);
const ce = e => document.createElement(e);

const textEndpoint = 'http://raspberrypi:3000/text';

const printBtn = $('#printBtn');
const textBox = $('#textBox');
const altFontBox = $('#altFontBox');
const doubleWidthBox = $('#doubleWidthBox');
const doubleHeightBox = $('#doubleHeightBox');

function print() {
    const text = textBox.value;
    if (!text) {
        return;
    }

    const opts = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            text
        })
    };

    fetch(textEndpoint, opts)
        .then(res => console.log)
        .catch(err => console.error);
}

/* Section handlers */

function toggleSection(button) {
    const section = button.parentElement;
    section.classList.toggle('expanded');
}

/* Setup */

function addHandlers() {
    printBtn.onclick = () => print();

    const sectionButtons = $$('.section-btn');
    for (const button of sectionButtons) {
        button.onclick = () => toggleSection(button);
    }
}

addHandlers();