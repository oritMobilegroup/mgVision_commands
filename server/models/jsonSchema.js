const mongoose = require('mongoose');

const jsonSchema = new mongoose.Schema({
    jsonData: Object,
  });
  
  // Create a model based on the schema
  const JsonData = mongoose.model('JsonData', jsonSchema);
  

  module.exports = JsonData;