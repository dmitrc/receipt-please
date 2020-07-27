const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const maxW = 384;
const maxH = 100;

const canvas = $('#canvas');
canvas.width = maxW;
canvas.height = maxH;

const ctx = canvas.getContext('2d');
ctx.fillStyle = 'black';
ctx.fillRect(0, 0, maxW, maxH);

canvas.toBlob(blob => {
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