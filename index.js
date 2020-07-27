require('dotenv').config();

const express = require('express');
const app = express();

const compression = require('compression');
app.use(compression());

const cors = require('cors');
app.use(cors());

const multer = require('multer');
const upload = multer({ dest: __dirname + '/uploads' });

app.use(express.static(__dirname + '/public'));

app.post('/print', (req, res) => {
    console.log(req.body);
    console.log(req.file);

    res.send('OK');
});

app.listen(process.env.PORT, () => {
    console.log(`Listening at port ${process.env.PORT}...`)
});