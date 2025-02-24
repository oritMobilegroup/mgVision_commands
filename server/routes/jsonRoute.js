const express = require('express');
const router = express.Router();
const JsonData = require('../models/jsonSchema');
// const multer = require('multer');
// const storage = multer.memoryStorage();
const { connectToDatabase } = require('../config/db.js');

// const upload = multer({ storage: storage });

// GET endpoint to fetch JSON data by IMEI
router.get('/json/:imei', async (req, res) => {
  try {
    const imei = req.params.imei;
    const jsonData = await JsonData.findOne({ imei });
    if (!jsonData || !jsonData.AppRunningService || jsonData.AppRunningService.length === 0) {
      // If no data found, return empty arrays for AppRunningService and gyroCalibrationConfig
      return res.json({ AppRunningService: [], gyroCalibrationConfig: [] });
    }
    // If data found, return the JSON data
    return res.json(jsonData);
  } catch (error) {
    console.error('Error fetching JSON:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});


// PUT endpoint to update or create JSON data
router.put('/json', async (req, res) => {
  try {
    const updatedData = req.body;

    // Retrieve the existing JSON data
    let existingData = await JsonData.findOne({});// Check if any existing data

    if (!existingData) {
      // If no existing data, create a new entry
      existingData = await JsonData.create(updatedData);
    } else {
      // Return the updated or newly created data
      Object.assign(existingData, updatedData);
      await existingData.save();
    }

    return res.json(existingData);
  } catch (error) {
    console.error('Error updating JSON:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE endpoint to remove specific JSON data
router.delete('/json', async (req, res) => {
  try {
    const { package: packageToDelete, ...keyValueToDelete } = req.body;
    console.log("Received request body:", req.body);

    if (!packageToDelete) {
      // If package name not provided, return error
      return res.status(400).json({ message: 'Package name is required for deletion.' });
    }

    const existingData = await JsonData.findOne({});
    if (!existingData) {
      // If no data found, return not found error
      return res.status(404).json({ message: 'Data not found' });
    }

    const packageObj = existingData.AppRunningService.find(item => item.package === packageToDelete);
    if (!packageObj) {
      // If specified package not found, return not found error
      return res.status(404).json({ message: 'Package not found' });
    }

    if (Object.keys(keyValueToDelete).length > 0) {
      // Delete specific key-value pair within a package
      Object.entries(keyValueToDelete).forEach(([key, value]) => {
        if (packageObj[key] === value) {
          console.log('Deleting key-value pair:', key, value);
          delete packageObj[key];
        } else {
          return res.status(404).json({ message: `Key-value pair not found for key: ${key}` });
        }
      });

      existingData.markModified('AppRunningService');
    } else {
      // If no key-value pair provided, delete the entire package
      existingData.AppRunningService = existingData.AppRunningService.filter(item => item.package !== packageToDelete);
    }

    await existingData.save();
    console.log('Deletion successful. Updated data:', existingData);
    return res.status(200).json({ message: 'Deletion successful' });
  } catch (error) {
    if (!res.headersSent) { // Check if the response is not already sent
      console.error('Error during deletion:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
});








// POST endpoint for inserting new JSON data from a file
// router.post('/insert', upload.single('json'), async (req, res) => {
//   try {
//     const { imei } = req.body;// IMEI associated with the JSON data
//     const jsonFileBuffer = req.file.buffer.toString('utf8');

//     if (!imei || !jsonFileBuffer) {
//       // If IMEI or JSON file buffer is missing, return error
//       return res.status(400).json({ message: 'IMEI and JSON file are required.' });
//     }

//     const jsonContent = JSON.parse(jsonFileBuffer);

//     console.log('Received JSON Content:', jsonContent);

//     if (!jsonContent || (!jsonContent.AppRunningService && !jsonContent.gyroCalibrationConfig)) {
//       return res.status(400).json({ message: 'Invalid JSON structure.' });
//     }
//     // Process and insert the JSON content into the database as needed...
//     // This section should include logic to combine or update existing data with the new JSON content,
//     // and then save it to the database.
//     const existingAppRunningServiceData = (await JsonData.findOne({ imei }))?.AppRunningService || [];
//     const combinedAppRunningServiceData = existingAppRunningServiceData.concat(
//       jsonContent.AppRunningService?.map((item) => ({ ...item, check_every: 10 })) || []
//     );

//     const existingGyroCalibrationConfigData = (await JsonData.findOne({ imei }))?.gyroCalibrationConfig || [];
//     const combinedGyroCalibrationConfigData = (jsonContent.gyroCalibrationConfig || []).map((item) => item);

//     const existingDoc = await JsonData.findOne({ imei });

//     if (existingDoc) {
//       existingDoc.AppRunningService = combinedAppRunningServiceData;
//       existingDoc.gyroCalibrationConfig = existingGyroCalibrationConfigData.concat(combinedGyroCalibrationConfigData);

//       await existingDoc.save();
//     } else {
//       const newDoc = new JsonData({
//         imei,
//         AppRunningService: combinedAppRunningServiceData,
//         gyroCalibrationConfig: combinedGyroCalibrationConfigData,
//       });
//       await newDoc.save();
//     }

//     return res.status(201).json({ message: 'IMEI and JSON inserted successfully.' });
//   } catch (error) {
//     console.error('Error inserting IMEI and JSON:', error);
//     return res.status(500).json({ message: 'Internal Server Error' });
//   }
// });




router.get('/retrievejson', async (req, res) => {
  try {
      // Extract the IMEI from the query parameters
      const { IMEI } = req.query;

      if (!IMEI) {
          return res.status(400).json({ message: 'IMEI is required' });
      }

      // Search for the document in the database by IMEI
      const data = await Data.findOne({ IMEI });

      if (!data) {
          return res.status(404).json({ message: 'Data not found for the provided IMEI' });
      }

      // Return the found document's JSON data
      res.json(data.JSON); // Adjust this according to your schema if your JSON field is named differently
  } catch (error) {
      console.error('Error retrieving JSON:', error);
      res.status(500).json({ error: 'An error occurred while retrieving JSON', details: error.message });
  }
});



module.exports = router;