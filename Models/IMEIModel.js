const mongoose = require('mongoose');

const imeiSchema = new mongoose.Schema({
  imei: String,
  odometer_correction_value: Number,
  distance: String,
  timestamp: String,
  fingerprint:String
});

const IMEIModel = mongoose.model('IMEI', imeiSchema);
   imeiSchema.index({ imei: 1 });
module.exports = IMEIModel;

