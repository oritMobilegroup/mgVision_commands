// imeiListModel.js

const mongoose = require('mongoose');

const imeiListSchema = new mongoose.Schema({
  IMEI:  String,
  TIMESTAMP: Date
});

const ImeiList = mongoose.model('ImeiList', imeiListSchema);

module.exports = ImeiList;
