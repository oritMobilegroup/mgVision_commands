const mongoose = require('mongoose');

const imeiSchema = new mongoose.Schema({
  imei: {
    type: String
  },
  fingerprint: {
    type: String
  },
  distance: {
    type: String
  },
  odometer: {
    type: String},

  // You can add more fields as needed
});

const saveSchema = mongoose.model('saveSchema', imeiSchema);

module.exports = saveSchema;
