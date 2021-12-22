const $ = (s, e) => (e || document).querySelector(s);
const $$ = (s, e) => (e || document).querySelectorAll(s);
const ce = e => document.createElement(e);

const textEndpoint = 'http://raspberrypi:3000/text';

const printBtn = $('#printBtn');
const textBox = $('#textBox');

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
        body: JSON.stringify({ text })
    };

    fetch(textEndpoint, opts)
        .then(res => console.log)
        .catch(err => console.error);
}

/* Setup */

function addHandlers() {
    printBtn.onclick = () => print();
}

addHandlers();