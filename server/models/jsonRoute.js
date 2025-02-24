
// jsonRoute.js
const express = require('express');
const router = express.Router();
const JsonData = require('../models/jsonSchema');

router.get('/json', async (req, res) => {
  try {
      const jsonData = await JsonData.findOne({});
      console.log('Retrieved JSON Data:', jsonData); // Log the retrieved data
      if (!jsonData || !jsonData.data || !jsonData.data.AppRunningService || !Array.isArray(jsonData.data.AppRunningService)) {
          return res.json({ data: { AppRunningService: [] } }); // Return empty array if no data or invalid data structure
      }
      return res.json(jsonData);
  } catch (error) {
      console.error('Error fetching JSON:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
  }
});




// router.put('/json', async (req, res) => {
//     try {
//         const updatedData = req.body;
//         // Retrieve the existing JSON data
//         let existingData = await JsonData.findOne({});
//         if (!existingData) {
//             // If no existing data, create a new entry
//             existingData = await JsonData.create({ data: [updatedData] });
//         } else {
//             // Update the existing JSON data
//             existingData.data.push(updatedData); // Use push to add the updatedData to the array
//             await existingData.save();
//         }
//         return res.json(existingData);
//     } catch (error) {
//         console.error('Error updating JSON:', error);
//         return res.status(500).json({ message: 'Internal Server Error' });
//     }
// });
router.put('/json', async (req, res) => {
  try {
      const updatedData = req.body;

      // Retrieve the existing JSON data
      let existingData = await JsonData.findOne({});
      
      if (!existingData) {
          // If no existing data, create a new entry
          existingData = await JsonData.create({ AppRuningService: [updatedData] });
      } else {
          // Find the index of the item to update in the array
          const indexToUpdate = existingData.AppRuningService.findIndex(item => item.package === updatedData.package);

          if (indexToUpdate !== -1) {
              // Update the existing item
              existingData.AppRuningService[indexToUpdate] = updatedData;
          } else {
              // Add the new item if not found
              existingData.AppRuningService.push(updatedData);
          }

          // Save the changes
          existingData.markModified('AppRuningService'); // Mark 'data' field as modified
          await existingData.save(); // Save the changes
      }

      return res.json(existingData);
  } catch (error) {
      console.error('Error updating JSON:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
  }
});



module.exports = router;
