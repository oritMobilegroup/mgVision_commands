const express = require('express');
const router=express.Router();
const IMEIModel=require("./IMEIModel")
app.post('/search', (req, res) => {
  const imei = req.body.imei;
  searchIMEI(imei, (result) => {
    res.json(result);
  });
});

async function searchIMEI(imei, callback, retries = 3) {
    try {
      const data = await IMEIModel.findOne({ imei }).exec();
      if (data) {
        callback(data);
      } else {
        callback('No data found for the provided IMEI.');
      }
    } catch (err) {
      console.error('Error searching for IMEI:', err);
      if (retries > 0) {
        // Retry the operation after a short delay
        setTimeout(() => {
          searchIMEI(imei, callback, retries - 1);
        }, 1000); // Adjust the delay as needed
      } else {
        callback('An error occurred.');
      }
    }
  }
// ==== בקשת פוסט לDB

router.post('/save-data', (req, res) => {
  // Extract data from the request body
  const { imei, odometer_correction_value, distance, timestamp } = req.body;

  // Create a new document with the extracted data and save it to the database
  const newData = new IMEIModel({
    imei,
    odometer_correction_value,
    distance,
    timestamp,
  });

  newData.save()
  .then((savedData) => {
    res.status(200).json(savedData);
  })
  .catch((err) => {
    console.error('Error saving data:', err);
    res.status(500).json({ error: 'Failed to save data' });
  });


    
  });


  