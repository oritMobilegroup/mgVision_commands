//jshint esversion: 9
const express = require("express");
const path = require("path");

const app = express();
const bodyParser = require("body-parser");
const fs = require("fs");
app.use(express.static(__dirname));

// set the view engine to ejs
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
const express1 = require("express-fileupload");
app.use(express1());

app.post("/CL", function (req, res) {
  const carLocatorWebRequestHandler = require("./carLocatorWebRequestHandler");
  carLocatorWebRequestHandler.handle(req.body, res);
});

app.post("/getConfigCarLocator", function (req, res) {
  console.log("getConfigCarLocator POST request");
  let file = fs.readFileSync(
    "/var/www/html/server/CarLocator/configCarLocator.json"
  );
  let configJson = JSON.parse(file);
  res.send(configJson);
});

app.listen(4054, function () {
  console.log("CarLocatorAppServer listens on port 4054");
});
