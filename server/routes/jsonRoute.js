
const express = require('express');
const router = express.Router();
const JsonData = require('../models/jsonSchema');


  router.get('/json', async (req, res) => {
    try {
      const jsonData = await JsonData.findOne({});
      console.log(jsonData)
      if (!jsonData) {
        return res.json({}); // Return empty object if no data exists
      }
      return res.json(jsonData);
    } catch (error) {
      console.error('Error fetching JSON:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  router.put('/json', async (req, res) => {
    try {
      const updatedData = req.body;
  
      // Retrieve the existing JSON data
      let existingData = await JsonData.findOne({});
  
      if (!existingData) {
        // If no existing data, create a new entry
        existingData = await JsonData.create(updatedData );
      } else {
        // Update the existing JSON data
        existingData.jsonData = updatedData;
        await existingData.save();
      }
  
      return res.json( updatedData );
    } catch (error) {
      console.error('Error updating JSON:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });
 

 
module.exports = router;
