
const express = require('express');
const router = express.Router();
const JsonData = require('../models/jsonSchema');

router.post('/update-json', async (req, res) => {
    try {
      const updatedJSON = req.body;
  
      // Save the updated JSON to the database
      await JsonData.updateOne({}, { jsonData: updatedJSON }, { upsert: true });
  
      res.json({ message: 'JSON updated and saved successfully' });
    } catch (error) {
      console.error('Error updating and saving JSON:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.get('/', (req, res) => {
    res.sendFile(__dirname + '../.././json.html');
    console.log('../.././json.html')
  });
  router.get('/get-json', async (req, res) => {
    try {
      // Assuming you have a single document in your collection
      const jsonDocument = await JsonData.findOne();
  
      if (!jsonDocument) {
        return res.status(404).json({ message: 'JSON document not found in the database' });
      }
  
      res.json(jsonDocument);
    } catch (error) {
      console.error('Error fetching JSON from the database:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  // Handle POST request to update JSON
 
module.exports = router;
