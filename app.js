const express = require('express');
const mongoose = require('./models/connect');
const morgan = require('morgan');
const moment = require('moment');

const infect = require('./controllers/infect');

require('dotenv').config();
const app = express();
const port = 3000;

// db connect
mongoose();

// morgan log
app.use(morgan('combined'));

// timezone
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

// router
app.use('/infect', infect);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
