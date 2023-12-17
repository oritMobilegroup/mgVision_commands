// server/routes/api.js
/* jshint esversion: 9 */

const express = require('express');
const router = express.Router();
const Data = require('../models/data');
const ImeiList = require('../models/imei_list');

// the new value -command.js
router.post('/store', async (req, res) => {

  try {
    const { IMEI, COMMAND } = req.body;
    
    const currentTimestamp = new Date();
    // Check if data with the same IMEI already exists
    const existingData = await Data.findOne({ IMEI });
    

    if (existingData) {
      if(existingData.STATUS=="in progress"){
        res.json({ message: 'In process, wait' })
        return;
      }
      // If data with the same IMEI exists, update the existing record
      existingData.COMMAND = COMMAND;
      existingData.TIMESTAMP = currentTimestamp; // Update the timestamp
      existingData.STATUS = "in progress";
      await existingData.save();
      res.json({ message: 'Data updated successfully', STATUS: 'in progress'  });
      console.log("Data updated successfully");
    } else {
      // If data with the same IMEI doesn't exist, create a new record
      const newData = new Data({ IMEI, COMMAND , TIMESTAMP: currentTimestamp , RESULT, STATUS: "in progress" ,});
      await newData.save();
      res.json({ message: 'Data stored successfully', STATUS: 'in progress' });
      console.log("Data stored successfully");
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while storing data', details: error.message });
  }
});

router.post('/store-result', async (req, res) => {
  try {
    const { IMEI, RESULT } = req.body;

    // Check if data with the same IMEI and COMMAND already exists
    const existingData = await Data.findOne({ IMEI });
    const currentTimestamp = new Date();
    if (existingData) {
      // If data with the same IMEI and COMMAND exists, update the RESULT value
      existingData.RESULT = RESULT;
      existingData.STATUS = "done";
      existingData.TIMESTAMP = currentTimestamp;

      await existingData.save();
      res.json({ message: 'Data updated successfully' });
      console.log("Data updated successfully");
    } else {
      // If data with the same IMEI and COMMAND doesn't exist, save new data
      const newData = new Data({ IMEI, RESULT , TIMESTAMP: currentTimestamp});
      console.log(newData)
      
      await newData.save();
      res.json({ message: 'Data stored successfully' });
      console.log("Data stored successfully");
    }
  } catch (error) {
    // Handle server errors with a 500 status and a detailed error message
    res.status(500).json({ error: 'An error occurred while storing data', details: error.message });
  }
});

const blockedIMEIs = new Set();

//block imeis that used-command.js
router.post('/block-imei', (req, res) => {
  try {
    const { IMEI } = req.body;

    if (!IMEI) {
      return res.status(400).json({ error: 'Invalid request. IMEI is required.' });
    }

    if (blockedIMEIs.has(IMEI)) {
      return res.status(400).json({ error: `IMEI ${IMEI} is already blocked.` });
    }

    blockedIMEIs.add(IMEI);
    res.json({ message: `IMEI ${IMEI} has been blocked successfully.` });
  } catch (error) {
    console.error('Error blocking IMEI:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




router.post('/restart', async (req, res) => {
  try {
    const { IMEI } = req.body;
    const data = await Data.findOne({ IMEI })
      .sort({ TIMESTAMP: -1 })
      .exec();

    if (data) {
      // Update the status to 'DONE'
      data.COMMAND=''
      data.STATUS = "wait";
      data.RESULT=""
      
      
      await data.save();

      res.json({ RESULT: data.RESULT, COMMAND: data.STATUS });
    } else {
      res.status(404).json({ error: 'Result not found or not in progress' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});





// Apply the limiter middleware specifically to the '/imeis' endpoint
router.get('/imeis', async (req, res) => {
  try {
    // Fetch all unique IMEIs from the Data collection
    const uniqueIMEIs = await ImeiList.distinct('IMEI', {
      TIMESTAMP: { $gte: new Date(Date.now() - 60 * 1000) }, // Records within the last minute
    });
    res.json(uniqueIMEIs);
  } catch (error) {
    console.error('Error fetching IMEIs:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching IMEIs' });
  }
});


//get imei and return string, script.js
router.post('/retrieve', async (req, res) => {
  try {
    console.log(req.body)
    const { IMEI } = req.body; 
    saveinei(IMEI)
    const data = await Data.findOne({ IMEI })
      .sort({ TIMESTAMP: -1 })
      .exec();

    if (data) {
      console.log(IMEI); // Log the IMEI value
      console.log(data + " data");
      console.log("status " + data.STATUS)
      

     if(data.STATUS == 'in progress') {
      // Save the updated document
      // await data.save();
      
      res.json(data.COMMAND);
    }
    else{
      res.json("Waiting the result");
    }
    } else {
      res.status(404).json({ error: 'Data not found' });

      
    }
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: 'An error occurred' });
  }
});
router.post('/retrieve-result', async (req, res) => {
  try {
    console.log(req.body)
    const { IMEI } = req.body; 
  
    const data = await Data.findOne({ IMEI })
      .sort({ TIMESTAMP: -1 })
      .exec();

    if (data) {
      console.log(IMEI); // Log the IMEI value
      console.log(data + " data");
      // Save the updated document
      // await data.save();
      res.json({RESULT:data.RESULT,STATUS:data.STATUS});
    } else {
      res.status(404).json({ error: 'Data not found' });
      
    }
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: 'An error occurred' });
  }
});
const saveinei=(IMEI)=>{
  const currentTimestamp = new Date();

   
  console.log(  IMEI)
      // Check if the IMEI already exists
      // Save the new IMEI
      const newIMEI = new ImeiList({
        IMEI,
        TIMESTAMP: currentTimestamp
  
      });
       newIMEI.save();

}


// save imei for the list - script.js
router.post('/save-imei', async (req, res) => {
  try {
    const { IMEI } = req.body;

   

    // await newIMEI.save();

    res.json({ message: 'IMEI saved successfully' });
  } catch (error) {
    console.error('Error saving IMEI:', error.message);
    res.status(500).json({ error: 'An error occurred while saving IMEI' });
  }
});






module.exports = router;
