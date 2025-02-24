const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const getParamConfigModel = require('../models/structuresConfig'); // Adjust the path as necessary
const { verifyToken, currentToken } = require("../token"); // Assuming you use token-based authenticationrouter.post('/update_structure_config', verifyToken, async (req, res) => {
   
   
//     router.post('/update_structure_config', verifyToken, async (req, res) => {

//     try {
//         const { IMEI, VersionId, Data } = req.body;

//         // Validate required fields
//         if (!IMEI || !VersionId || !Data || !Data.EventStructures || !Data.ParamStructures) {
//             return res.status(400).json({ error: 'Invalid request. IMEI, VersionId, and nested Data structure with EventStructures and ParamStructures are required.' });
//         }

//         // Initialize and get the ParamConfig model
//         const ParamConfig = await getParamConfigModel();

//         if (!ParamConfig) {
//             return res.status(500).json({ error: 'ParamConfig model is not initialized.' });
//         }

//         // Calculate the md5 hash for the new Data structure
//         const md5Hash = crypto.createHash('md5').update(JSON.stringify(Data)).digest('hex');

//         // Check if the document with the specified IMEI exists
//         let config = await ParamConfig.findOne({ IMEI });

//         if (!config) {
//             // Create a new document with a default structure if IMEI does not exist
//             config = await ParamConfig.create({
//                 IMEI,
//                 Data: {
//                     EventStructures: [],
//                     ParamStructures: []
//                 }
//             });
//         }

//         // Update both ParamStructures and EventStructures in a single command
//         const updateCommand = {
//             $addToSet: {
//                 'Data.ParamStructures': { $each: Data.ParamStructures },
//                 'Data.EventStructures': { $each: Data.EventStructures }
//             },
//             $set: { md5: md5Hash }
//         };

//         // Perform the update
//         const updatedConfig = await ParamConfig.findOneAndUpdate(
//             { IMEI },
//             updateCommand,
//             { new: true, upsert: true }
//         );

//         // Return IMEI and VersionId in the response
//         res.status(200).json({
//             data: {
//                 IMEI: updatedConfig.IMEI,
//                 VersionId // Return the VersionId from the request, not from the database
//             }
//         });

//     } catch (error) {
//         console.error('Error updating structure config:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });



// router.post('/update_structure_config', verifyToken, async (req, res) => {
//     try {
//         const { IMEI, VersionId, Data, event_id, broadcast_parameters } = req.body;

//         // Validate IMEI and VersionId
//         if (!IMEI || !VersionId) {
//             return res.status(400).json({ error: 'Invalid request. IMEI and VersionId are required.' });
//         }

//         // Initialize and get the ParamConfig model
//         const ParamConfig = await getParamConfigModel();
//         if (!ParamConfig) {
//             return res.status(500).json({ error: 'ParamConfig model is not initialized.' });
//         }

//         // Calculate the md5 hash based on request data to track changes
//         const md5Hash = crypto.createHash('md5').update(JSON.stringify(req.body)).digest('hex');

//         // Scenario 1: Full Update with `Data` (ParamStructures and EventStructures)
//         if (Data && Data.ParamStructures && Data.EventStructures) {
//             // Add new structures or update existing ones
//             const updateCommand = {
//                 $addToSet: {
//                     'Data.ParamStructures': { $each: Data.ParamStructures },
//                     'Data.EventStructures': { $each: Data.EventStructures }
//                 },
//                 $set: { md5: md5Hash }
//             };

//             const updatedConfig = await ParamConfig.findOneAndUpdate(
//                 { IMEI },
//                 updateCommand,
//                 { new: true, upsert: true }
//             );

//             return res.status(200).json({
//                 data: {
//                     IMEI: updatedConfig.IMEI,
//                     VersionId // Return the VersionId from the request, not from the database
//                 }
//             });
//         }

//         // Scenario 2: Update `broadcast_parameters` of an existing `EventStructures` item by `event_id`
//         if (event_id && Array.isArray(broadcast_parameters)) {
//             const query = { IMEI, 'Data.EventStructures.event_id': event_id };

//             const updateCommand = {
//                 $addToSet: { 'Data.EventStructures.$.broadcast_parameters': { $each: broadcast_parameters } },
//                 $set: { md5: md5Hash }
//             };

//             const config = await ParamConfig.findOneAndUpdate(
//                 query,
//                 updateCommand,
//                 { new: true }
//             );

//             if (!config) {
//                 return res.status(404).json({ error: 'Event with specified IMEI and event_id not found.' });
//             }

//             return res.status(200).json({
//                 data: {
//                     IMEI: config.IMEI,
//                     VersionId
//                 }
//             });
//         }

//         // If neither condition is met, return an error
//         return res.status(400).json({ error: 'Invalid request structure. Provide either Data with ParamStructures and EventStructures or event_id with broadcast_parameters.' });

//     } catch (error) {
//         console.error('Error updating structure config:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });
// POST route to add or update parameter configuration


const diffGeneral = require('../models/DiffGeneral'); // Change tracking model


// Function to compare and track differences
const getDifferences = (oldData, newData) => {
    const changes = {};
    for (const key in newData) {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
            changes[key] = { old: oldData[key] || null, new: newData[key] || null };
        }
    }
    return changes;
};

// **POST Route to Update Structure Config**
router.post('/update_structure_config', verifyToken, async (req, res) => {
    try {
        const { IMEI, VersionId, Data, event_id, broadcast_parameters, ...otherFields } = req.body;

        // Validate IMEI and VersionId
        if (!IMEI || !VersionId) {
            return res.status(400).json({ error: 'Invalid request. IMEI and VersionId are required.' });
        }

        // Initialize and get the ParamConfig model
        const ParamConfig = await getParamConfigModel();
        if (!ParamConfig) {
            return res.status(500).json({ error: 'ParamConfig model is not initialized.' });
        }

        // Fetch existing config before update (for change tracking)
        let oldConfig = await ParamConfig.findOne({ IMEI });
        const oldData = oldConfig ? JSON.parse(JSON.stringify(oldConfig.Data)) : {};

        // Compute md5 hash for tracking changes
        const md5Hash = crypto.createHash('md5').update(JSON.stringify(req.body)).digest('hex');

        let updatedConfig;

        // **Scenario 1: Full Update with `Data` (ParamStructures & EventStructures)**
        if (Data && Data.ParamStructures && Data.EventStructures) {
            const updateCommand = {
                $addToSet: {
                    'Data.ParamStructures': { $each: Data.ParamStructures },
                    'Data.EventStructures': { $each: Data.EventStructures }
                },
                $set: { md5: md5Hash, VersionId }
            };

            updatedConfig = await ParamConfig.findOneAndUpdate(
                { IMEI },
                updateCommand,
                { new: true, upsert: true }
            );
        }

        // **Scenario 2: Update a specific `EventStructures` field by `event_id`**
        else if (event_id) {
            const existingConfig = await ParamConfig.findOne({ IMEI, 'Data.EventStructures.event_id': event_id });

            if (existingConfig) {
                // Prepare update fields
                const updateFields = {};
                if (broadcast_parameters) {
                    updateFields['$addToSet'] = {
                        'Data.EventStructures.$.broadcast_parameters': { $each: broadcast_parameters }
                    };
                }

                Object.keys(otherFields).forEach(field => {
                    updateFields['$set'] = updateFields['$set'] || {};
                    updateFields['$set'][`Data.EventStructures.$.${field}`] = otherFields[field];
                });

                updateFields['$set'] = updateFields['$set'] || {};
                updateFields['$set']['md5'] = md5Hash;
                updateFields['$set']['VersionId'] = VersionId;

                updatedConfig = await ParamConfig.findOneAndUpdate(
                    { IMEI, 'Data.EventStructures.event_id': event_id },
                    updateFields,
                    { new: true }
                );
            } else {
                // If `event_id` is not found, add a new entry
                const newEventStructure = {
                    event_id,
                    ...otherFields,
                    broadcast_parameters: broadcast_parameters || []
                };

                const addNewEventCommand = {
                    $push: { 'Data.EventStructures': newEventStructure },
                    $set: { md5: md5Hash, VersionId }
                };

                updatedConfig = await ParamConfig.findOneAndUpdate(
                    { IMEI },
                    addNewEventCommand,
                    { new: true, upsert: true }
                );
            }
        }

        // If no conditions were met
        if (!updatedConfig) {
            return res.status(400).json({ error: 'Invalid request structure. Provide either Data with ParamStructures and EventStructures or event_id with specific fields to update.' });
        }

        // **Track Changes: Save Old and New Data in `diffGeneral` Collection**
        const newData = updatedConfig.Data;
        const changes = getDifferences(oldData, newData);

        if (Object.keys(changes).length > 0) {
            await diffGeneral.create({
                IMEI,
                OldData: oldData,
                NewData: newData,
                Changes: changes,
                Timestamp: new Date()
            });
        }

        // **Response**
        res.status(200).json({
            data: {
                IMEI,
                VersionId
            }
        });

    } catch (error) {
        console.error('Error updating structure config:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;




