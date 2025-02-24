const express = require('express');
const router = express.Router();
const Data = require('../models/dataForCommand');



const moment = require('moment');

router.post('/updateresult', async (req, res) => {
    try {
        const normalizedBody = Object.keys(req.body).reduce((acc, key) => {
            acc[key.toUpperCase()] = req.body[key];
            return acc;
        }, {});

        const { IMEI, RESULT, TIMESTAMP } = normalizedBody;

        if (!IMEI || RESULT === undefined || !TIMESTAMP) {
            return res.status(400).json({ message: 'IMEI, RESULT, and TIMESTAMP are required.' });
        }

        console.log('Received TIMESTAMP:', TIMESTAMP);

        const parsedTimestamp = moment(TIMESTAMP, 'DD-MM-YYYY HH:mm:ss', true);

        if (!parsedTimestamp.isValid()) {
            console.error('Invalid TIMESTAMP format. Expected format: DD-MM-YYYY HH:mm:ss.');
            return res.status(400).json({ message: 'Invalid TIMESTAMP format. Expected format: DD-MM-YYYY HH:mm:ss.' });
        }

        const timestampDate = parsedTimestamp.toDate();

        await Data.findOneAndUpdate(
            { IMEI: IMEI },
            {
                $push: {
                    results: {
                        $each: [{ TIMESTAMP: timestampDate, RESULT: RESULT }],
                        $sort: { TIMESTAMP: -1 }, // Sort by TIMESTAMP in descending order (newest first)
                        $slice: 5 // Keep only the last 5 results
                    }
                }
            },
            { new: true, upsert: true }
        );

        res.json({ message: 'Result updated successfully' });
        console.log('Update successful:', { IMEI, RESULT, TIMESTAMP });
    } catch (error) {
        console.error('Error updating result:', error);
        res.status(500).json({ error: 'An error occurred while updating the result.', details: error.message });
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
  router.get('/get_results', async (req, res) => {
    try {
        // Extract the IMEI from query parameters
        const { IMEI } = req.query; // Use req.query for GET requests

        // Validate that the IMEI parameter was provided
        if (!IMEI) {
            return res.status(400).json({ error: 'IMEI query parameter is required.' });
        }

        // Fetch documents from the Data collection that match the provided IMEI
        const data = await Data.findOne({ IMEI: IMEI });

        // If no document is found, respond with an appropriate message
        if (!data) {
            return res.status(404).json({ message: 'No results found for the provided IMEI.' });
        }

        // Respond with the found document
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
