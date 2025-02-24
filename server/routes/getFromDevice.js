

const express = require('express');
const router = express.Router();
const Data = require('../models/storejsonSchema');

router.post('/storejson', async (req, res) => {

    try {
        console.log("  jrfjr")

        const { IMEI, TIMESTAMP, JSON_Data } = req.body;
        console.log(req.body)

        // Create or update the data for the given IMEI.
        const options = { upsert: true, new: true, setDefaultsOnInsert: true };
        const query = { IMEI };
        const update = { $set: { TIMESTAMP: TIMESTAMP, JSON_Data: JSON_Data } };

        const result = await Data.findOneAndUpdate(query, update, options);
        res.status(200).json({ message: 'JSON stored successfully', json: result });
        console.log(result);
    } catch (error) {
        console.error('Error storing JSON:', error);
        res.status(500).json({ error: 'An error occurred while storing JSON', details: error.message });
    }
});



router.post('/retrievejson', async (req, res) => {
    try {
        const { IMEI } = req.body;

        if (!IMEI) {
            return res.status(400).json({ message: 'IMEI is required in the request body.' });
        }

        const data = await Data.findOne({ IMEI });

        if (!data) {
            return res.status(404).json({ message: 'Data not found for the provided IMEI.' });
        }

        res.json(data.JSON_Data); // Make sure 'JSON' matches the field name in your schema
    } catch (error) {
        console.error('Error retrieving JSON:', error);
        res.status(500).json({ error: 'An error occurred while retrieving JSON', details: error.message });
    }
});

router.post('/updateresult', async (req, res) => {
    try {
        // Normalize keys to uppercase
        const normalizedBody = Object.keys(req.body).reduce((acc, key) => {
            acc[key.toUpperCase()] = req.body[key];
            return acc;
        }, {});

        const { IMEI, RESULT } = normalizedBody;

        // Check if both IMEI and RESULT are provided
        if (!IMEI || RESULT === undefined) {
            return res.status(400).json({ message: 'Both IMEI and RESULT are required in the request body.' });
        }

        // Find a document with the given IMEI or create a new one if it doesn't exist
        const data = await Data.findOneAndUpdate({ IMEI: IMEI },
            { $set: { RESULT: RESULT } },
            { new: true, upsert: true }
        );

        // Assuming the operation is successful and data is the updated document
        res.json({ message: 'Result updated successfully', IMEI: IMEI, RESULT: RESULT });
    } catch (error) {
        console.error('Error updating result:', error);
        res.status(500).json({ error: 'An error occurred while updating the result', details: error.message });
    }
});



router.get('/getresults', async (req, res) => {
    try {
      const users = await Data.find(); // Fetch all documents from USER collection
      res.json(users);
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });





module.exports = router;

