//jshint esversion: 8

const consts = require("../constants/consts");
const functions = require("../constants/functions");
const parsePacket = require("./parsePacket");
const carLocatorConsts = require("./carLocatorConsts");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
var net = require("net");
var HOST = consts.serviceIp;
var PORT = carLocatorConsts.carLocatorPort;
global.activeSockets = [];
const TAG = "CarLocatorTCPReceiver: ";
const {sendDataTestOtofusionURL}=require("./SERVER/TestOtofusion.js");
const {sendAxios}=require("./SERVER/Otofousion");

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
net
  .createServer(function (sock) {
    // We have a connection - a socket object is assigned to the connection automatically
    // console.log(TAG + ' CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    sock.on("data", async function (data) {
      console.log(TAG + "Received buffer - ");
      console.log(data);
      var request = {

        ip: sock.remoteAddress,
        port: sock.remotePort,
        date: functions.getDate(),
        time: functions.getCurrentTime(),
        timestamp: Date.now(),
        //add send imei 
        // imei:responseJson
      };
   
      //Will check if the packet is legal, and will return the appropriate reply.
      var response = await parsePacket.parse(request, data, data.toJSON().data) 
     var responseJson=JSON.stringify(response);
     console.log(TAG+"            +responseJson+                  "+responseJson)

      if (response != null) {
        console.log(TAG + "response: "); 
        console.log(response);
        sock.write(response);


        sock.on('data', (data) => {
          // const message = data.toString().trim();
          // console.log(TAG +"Client response: ${message}");
          // Will write here the client response
          // for(var i = 0 ; i < data.length ; i++){
          //   var num = data[i];
          //   let hexString = num.toString(16);
          //   // console.log(hexString);
          //   console.log( TAG +"Client response data[" + i + "]= " + hexString);
          //   // console.log( "data[" + i + "]= " + dataArray[i]);
          // }

          // // Close the connection
          // socket.end();
        });
        // socket.end();
      }
  
      // sock.pipe(sock);
    });

    sock.on("close", function (data) {
      console.log(
        TAG +
        "socket closed for ip " +
        sock.remoteAddress +
        " and port " +
        sock.remotePort
      );
      for (var t = 0; t < global.activeSockets.length; t++) {
        if (
          sock.remoteAddress == global.activeSockets[t].remoteAddress &&
          sock.remotePort == global.activeSockets[t].remotePort
        ) {
          console.log(TAG + "found socket to remove from array");
          global.activeSockets.splice(t, 1);
          break;
        }
      }
    });
    global.activeSockets.push(sock);
  })
  .listen(PORT, HOST);
console.log(TAG + "Server listening on " + HOST + ":" + PORT);

app.post("/send_command_to_locator", function (req, res) {
  console.log(
    "send command to locator received and num of sockets is " +
    global.activeSockets.length
  );
  const SendCommandToLocator = require("./SendCommandToLocator");
  var commandSender = new SendCommandToLocator(req.body, global.activeSockets);
  commandSender.sendMessage().then(function (status) {
    console.log("status is " + status);
    if (status) {
      res.send({ status: "OK" });
    } else {
      res.send({ status: "ERROR" });
    }
  });
}); 

app.post("/send_command", function (req, res) {
  console.log(
    "send command to locator received and num of sockets is " +
    global.activeSockets.length
  );
  const SendCommandToLocator = require("./SendCommandToLocator");
  var commandSender = new SendCommandToLocator(req.body, global.activeSockets);
  commandSender.sendMessage().then(function (status) {
    console.log("status is " + status);
    if (status) {
      res.send({ status: "OK" });
    } else {
      res.send({ status: "ERROR" });
    }
  });
}); 
app.listen(4052, function () {
  console.log("Web listener server listens on port 4052");
});
