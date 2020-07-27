require('dotenv').config();

const escpos = require('escpos');
escpos.USB = require('escpos-usb');

const express = require('express');
const compression = require('compression');
const cors = require('cors');
const multer = require('multer');

const enableLog = true;
const log = (m) => {
    enableLog && console.log(m);
}
const logError = (m) => {
    log(`ERROR: ${m}`);
}

const initPrinter = () => {
    return new Promise((resolve, reject) => {
        const device = new escpos.USB(process.env.USB_VID, process.env.USB_PID);
        const printer = new escpos.Printer(device);

        device.open(err => {
           if (err) {
               logError(err);
               reject(err);
           }
           else {
               resolve(printer);
           }
        });
    });
};

const printImage = (printer, url) => {
    return new Promise((resolve, reject) => {
        escpos.Image.load(url, async (image) => {
            try {
                await printer.image(image);
                printer.cut().close();
                resolve();
            }
            catch (err) {
                logError(err);
                reject(err);
            }
        });
    });
}

const handlePrint = async (req, res) => {
    if (!req.file) {
        logError('No blob attached');
        res.status(400).send('No blob attached');
        return;
    }

    try {
        const printer = await initPrinter();
        await printImage(printer, req.file.path);
        
        log('Printed successfully');
        res.send('OK');
    }
    catch (err) {
        logError(err);
        res.status(500).send(err);
    }
};

const app = express();
const upload = multer({ dest: __dirname + '/uploads' });

app.use(compression());
app.use(cors());
app.use(express.static(__dirname + '/public'));

app.post('/print', upload.single('blob'), handlePrint);

app.listen(process.env.PORT, () => {
    log(`Listening at port ${process.env.PORT}...`);
});