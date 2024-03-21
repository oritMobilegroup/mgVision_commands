const mongoose = require('mongoose');

const cellphoneSchema = new mongoose.Schema({
  imei: String,
  mac: String,
  phone_number: String,
  name: String,
  date: Date,
});

const Cellphone = mongoose.model('Cellphone', cellphoneSchema);

module.exports = Cellphone;
