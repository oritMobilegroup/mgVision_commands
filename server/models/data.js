// server/models/data.js
/* jshint esversion: 9 */

const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  IMEI: String,
  TIMESTAMP: Date,
  STATUS: String,
  COMMAND: String,
  RESULT:String
});

module.exports = mongoose.model('Data', dataSchema);

