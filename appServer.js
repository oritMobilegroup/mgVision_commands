const express = require('express');
const cors = require('cors');
const app = express();
// const https=require('https');
// const fs = require('fs');
// var path = require('path');
const bodyParser = require('body-parser');
const PostRouter = require('./Routers/PostRouter');
require('./db');

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cors());

// const PostUtils=require("./postUtils.js");
// 

// var key = fs.readFileSync(path.resolve(__dirname, '../../../cert/custom.key'));
// console.log("this is key "+key);
// var cert = fs.readFileSync(path.resolve(__dirname, '../../../cert/mgactivities_com.crt'));
// var ca = fs.readFileSync(path.resolve(__dirname, '../../../cert/mgactivities_com.ca'));

// const PostRouter=require("./Routers/PostRouter");


// app.use('/api/',PostRouter);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// const PORT = 4060;
// var httpsServer = https.createServer({
//     key: key,
//     cert: cert,
//     ca: ca
//   },app);
  

// app.use('/api', PostRouter);
 


  app.listen(4060, () => {
 console.log('Server is running on port 4000');
});
  //httpsServer.listen(PORT);


// app.post("/:iemi", async function(req, res) {
//     console.log('in InsertDcvThypoonData()');
//     dcvItem = {
// 	voltage: parseFloat(req.query.voltage),
// 	timeStamp: parseInt(req.query.timeStamp)
//     };
//     const result = await typhoonUtils.InsertDcvItem(dcvItem);
//     res.send(result);
// });

