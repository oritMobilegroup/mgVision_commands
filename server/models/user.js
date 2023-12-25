/* jshint esversion: 9 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    specialPassword: String,
    specialPasswordTimestamp: 
       Date,
  });
  const User = mongoose.model('User', userSchema);
  module.exports = User;
  
  