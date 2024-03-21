const mongoose = require('mongoose');

const imeiSchema = new mongoose.Schema({
    imei: String,
    message: String,
    app: String,
    date: String,
    timestamp: String,
  });
  
  const IMEI1 = mongoose.model('IMEI1', imeiSchema);


   imeiSchema.index({ imei: 1 });
    module.exports = IMEI1;
