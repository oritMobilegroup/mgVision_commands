/* jshint esversion: 9 */

const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const fs=require('fs');
const path = require('path'); 
// require('dotenv').config({path: __dirname + '/.env'});

// const storage = multer.memoryStorage(); 
const { connectToDatabase } = require('./config/db');
// require('dotenv').config();
app.use(express.static('public'));

var key = fs.readFileSync(path.resolve(__dirname, '../../../../cert/custom.key'));
console.log("this is key "+key);
var cert = fs.readFileSync(path.resolve(__dirname, '../../../../cert/mgactivities_com.crt'));
var ca = fs.readFileSync(path.resolve(__dirname, '../../../../cert/mgactivities_com.ca'));

// const port = 4062; 
const publicPath = path.join(__dirname, '../client'); 
connectToDatabase();

app.use(express.static(publicPath));
app.use(bodyParser.json());

app.use(cors());

const register = require('./Routers/register');
const send_sms = require('./Routers/send_sms');



app.use('/register', register);
app.use('/send_sms', send_sms);



var httpsServer = https.createServer({
    key: key,
    cert: cert,
    ca: ca
  },app);
//  app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

  httpsServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})

