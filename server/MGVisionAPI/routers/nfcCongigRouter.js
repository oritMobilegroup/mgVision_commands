const express = require('express');
const router = express.Router();
const getNFCConfigModel = require("../models/nfcCongig"); // Adjust the path as necessary
const { verifyToken, currentToken } = require("../token"); // Assuming you use token-based authentication

// // POST route to edit or add NFC configuration
// router.post('/update_nfc_config', verifyToken, async (req, res) => {
//     try {
//         const { IMEI, Data } = req.body;

//         // Validate required fields
//         if (!IMEI || !Data || typeof Data !== 'object') {
//             return res.status(400).json({ error: 'Invalid request. IMEI and Data are required.' });
//         }

//         // Initialize and get the NFCConfig model
//         const NFCConfig = await getNFCConfigModel();

//         if (!NFCConfig) {
//             return res.status(500).json({ error: 'NFCConfig model is not initialized.' });
//         }

//         // Separate DriverCodes from other fields in Data to avoid conflicts
//         const { DriverCodes, ...otherDataFields } = Data;

//         // Construct the update query
//         const updateQuery = {};

//         // Use $set for each individual field in otherDataFields
//         for (const [key, value] of Object.entries(otherDataFields)) {
//             updateQuery[`Data.${key}`] = value;
//         }

//         // Use $addToSet for DriverCodes, if provided
//         if (Array.isArray(DriverCodes) && DriverCodes.length > 0) {
//             updateQuery.$addToSet = { 'Data.DriverCodes': { $each: DriverCodes } };
//         }

//         // Update or insert the document
//         const config = await NFCConfig.findOneAndUpdate(
//             { IMEI },
//             { $set: updateQuery, ...updateQuery.$addToSet && { $addToSet: updateQuery.$addToSet } },
//             { new: true, upsert: true } // new=true returns the updated document, upsert=true creates a new document if IMEI is not found
//         );

//         // Return simplified response
//         res.status(200).json({
//             data: {
//                 IMEI: config.IMEI,
//             }
//         });

//     } catch (error) {
//         console.error('Error updating NFC configuration:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


router.post('/update_nfc_config', verifyToken, async (req, res) => {
    try {
        const { IMEI, VersionId, Data } = req.body;

        // Validate required fields
        if (!IMEI || !VersionId || !Data || typeof Data !== 'object') {
            return res.status(400).json({ error: 'Invalid request. IMEI, VersionId, and Data are required.' });
        }

        // Initialize and get the NFCConfig model
        const NFCConfig = await getNFCConfigModel();

        if (!NFCConfig) {
            return res.status(500).json({ error: 'NFCConfig model is not initialized.' });
        }

        // Separate DriverCodes from other fields in Data to avoid conflicts
        const { DriverCodes, ...otherDataFields } = Data;

        // Construct the update query without VersionId
        const updateQuery = {};

        // Use $set for each individual field in otherDataFields
        for (const [key, value] of Object.entries(otherDataFields)) {
            updateQuery[`Data.${key}`] = value;
        }

        // Add DriverCodes with $addToSet if provided
        if (Array.isArray(DriverCodes) && DriverCodes.length > 0) {
            updateQuery.$addToSet = { 'Data.DriverCodes': { $each: DriverCodes } };
        }

        // Update or insert the document
        const config = await NFCConfig.findOneAndUpdate(
            { IMEI },
            { $set: updateQuery, ...updateQuery.$addToSet && { $addToSet: updateQuery.$addToSet } },
            { new: true, upsert: true } // new=true returns the updated document, upsert=true creates a new document if IMEI is not found
        );

        // Return IMEI and VersionId in the response
        res.status(200).json({
            data: {
                IMEI: config.IMEI,
                VersionId: VersionId // Return the VersionId from the request, not from the database
            }
        });

    } catch (error) {
        console.error('Error updating NFC configuration:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
module.exports = router;
