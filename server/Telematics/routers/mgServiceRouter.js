

// // this is only for telematics



// // const express = require('express');
// // const router = express.Router();
// // const getMGServiceConfigModel = require('../models/mgServiceConfig'); // Adjust the path as necessary
// // const { verifyToken, currentToken } = require("../token");

// // // Full default structure to use as a template for new documents
// // const defaultData = {
// //   ConfigID: "01",
// //   Data: {
// //     GPS: {
// //       SendGpsAccOn: 5,
// //       SendGpsAccOff: 3600,
// //       GpsAzimuth: 30,
// //       SendGpsIdle: 120,
// //       SendGpsAccumulateDistance: 150,
// //       BackupBatteryX: 1800,
// //       BackupBatteryFirstX: 60,
// //       BackupBatteryAfterX: 1800
// //     },
// //     Temperature: {
// //       FrontSensorMac: "",
// //       RearSensorMac: "",
// //       SendTempRateAccOn: 5,
// //       SendTempRateAccOff: 10
// //     },
// //     TirePressure: {
// //       SendTireRateAccOn: 0,
// //       SendTireRateAccOff: 0,
// //       ALeftIn: "", ALeftOut: "", BLeftIn: "", BLeftOut: "",
// //       CLeftIn: "", CLeftOut: "", DLeftIn: "", DLeftOut: "",
// //       ELeftIn: "", ELeftOut: "", ARightIn: "", ARightOut: "",
// //       BRightIn: "", BRightOut: "", CRightIn: "", CRightOut: "",
// //       DRightIn: "", DRightOut: "", ERightIn: "", ERightOut: ""
// //     },
// //     CAN: {
// //       Type: "J1939",
// //       Baudrate: 500,
// //       Lock: 0,
// //       EnQuery: 1
// //     },
// //     DriverCodeSettings: {
// //       Type: "", Style: "allCodeOK", BeepTimeout: 240,
// //       WrongCodeLockDuration: 240, HoldCodeValidationAccOff: 240,
// //       WrongCodeCountBeforeLock: 5, EmergencyEnStatus: 1,
// //       IgnEnWithoutCode: 1, TechnicianCode: "123654987",
// //       buzzerRateWrongCode: 3
// //     },
// //     DriverCodes: ["1325"],
// //     EventsSettings: {
// //       '164': { active: 1, Video: 1, MinValue: 0, MaxValue: 0, OnDelay: 0, OffDelay: 0 },
// //       '261': { active: 1, Video: 1, MinValue: 0, MaxValue: 0, OnDelay: 0, OffDelay: 0 }
// //     },
// //     ActiveModules: {
// //       keypad: 0, NFC: 1, Gsensore: 1, TirePressure: 1, GpsOdometer: 1,
// //       Adas: 1, Dms: 1, leech: 1, Temperature: 1, CoexistsUnit1: 1,
// //       CoexistsUnit2: 1, CoexistsUnit3: 1, CoexistsUnit4: 1, bt: 1, CAN: 1
// //     },
// //     CalibrationCommands: {
// //       OdometerValue: 0, WarmStart: 0, GetLog: 0, IgnEnWithoutCode: "always"
// //     },
// //     PowerOffSetting: {
// //       PowerOffDelayDefault: 7200
// //     }
// //   }
// // };


// // // POST route to update DriverCodes and DriverCodeSettings for multiple IMEIs
// // router.post('/update_driver_codes', verifyToken, async (req, res) => {
// //     try {
// //         let updates = req.body;
// // console.log(updates);
// //         // Check if the request is an array or a single object
// //         if (!Array.isArray(updates)) {
// //             updates = [updates];  // If it's a single object, put it in an array to handle both cases the same way
// //         }

// //         // Validate input
// //         if (updates.length === 0) {
// //             return res.status(400).json({ error: 'Invalid request. An array of IMEI, DriverCodes, and VersionId objects is required.' });
// //         }

// //         // Initialize and get the MGServiceConfig model
// //         const MGServiceConfig = await getMGServiceConfigModel();

// //         if (!MGServiceConfig) {
// //             return res.status(500).json({ error: 'MGServiceConfig model is not initialized.' });
// //         }

// //         const results = [];

// //         for (const update of updates) {
// //             const { IMEI, DriverCodes, DriverCodeSettings, VersionId } = update;

// //             // Validate mandatory fields (IMEI, DriverCodes, and VersionId)
// //             if (!IMEI || !DriverCodes || !Array.isArray(DriverCodes) || DriverCodes.length === 0 || !VersionId) {
// //                 results.push({ IMEI, status: 'failed', error: 'Invalid data. IMEI, DriverCodes, and VersionId are required.' });
// //                 continue;
// //             }

// //             // Check if the document with this IMEI exists
// //             let sensor = await MGServiceConfig.findOne({ IMEI });

// //             if (!sensor) {
// //                 // If the IMEI does not exist, create a new document with the full default structure
// //                 const newData = {
// //                     ...defaultData,
// //                     IMEI,
// //                     ConfigID: defaultData.ConfigID,
// //                     Data: {
// //                         ...defaultData.Data,
// //                         DriverCodes, // Set DriverCodes from the request
// //                         DriverCodeSettings: { ...defaultData.Data.DriverCodeSettings, ...DriverCodeSettings } // Merge DriverCodeSettings with defaults
// //                     },
// //                     VersionId
// //                 };
// //                 sensor = new MGServiceConfig(newData);
// //                 await sensor.save();
// //                 results.push({ IMEI, VersionId });
// //             } else {
// //                 // Update the existing document
// //                 const updateFields = {
// //                     VersionId,
// //                     'Data.DriverCodeSettings': { ...sensor.Data.DriverCodeSettings, ...DriverCodeSettings }
// //                 };

// //                 await MGServiceConfig.findOneAndUpdate(
// //                     { IMEI },
// //                     {
// //                         $set: updateFields,
// //                         $addToSet: { 'Data.DriverCodes': { $each: DriverCodes } }
// //                     },
// //                     { new: true }
// //                 );

// //                 results.push({ IMEI, VersionId });
// //             }
// //         }

// //         // Format the response as requested
// //         const response = { data: results };

// //         // Respond with the formatted response
// //         res.status(200).json(response);

// //     } catch (error) {
// //         console.error('Error updating sensors:', error);
// //         res.status(500).json({ error: 'Internal Server Error' });
// //     }
// // });

// // module.exports = router;
// // this is for 2 db
// const express = require('express');
// const crypto = require('crypto');
// const router = express.Router();
// const getMGServiceConfigModel = require('../models/mgServiceConfig'); // Model for Telematics DB
// const getNFCConfigModel = require("../../MGVisionAPI/models/nfcCongig"); // Model for MGVisionAPI DB
// const { verifyToken } = require("../token");

// const defaultDataTelematics = {
//   ConfigID: "01",
//   Data: {
//     GPS: { SendGpsAccOn: 5, SendGpsAccOff: 3600, GpsAzimuth: 30 },
//     Temperature: { FrontSensorMac: "", RearSensorMac: "", SendTempRateAccOn: 5, SendTempRateAccOff: 10 },
//     TirePressure: { SendTireRateAccOn: 0, SendTireRateAccOff: 0 },
//     CAN: { Type: "J1939", Baudrate: 500, Lock: 0, EnQuery: 1 },
//     DriverCodeSettings: { Type: "", Style: "allCodeOK", BeepTimeout: 240, WrongCodeLockDuration: 240 },
//     DriverCodes: ["1325"],
//     EventsSettings: { '164': { active: 1 }, '261': { active: 1 } },
//     ActiveModules: { keypad: 0, NFC: 1, Gsensore: 1 },
//     CalibrationCommands: { OdometerValue: 0, WarmStart: 0 },
//     PowerOffSetting: { PowerOffDelayDefault: 7200 }
//   }
// };

// const defaultDataMGVisionAPI = {
//   Data: {
//     Style: "allCodeOK",
//     BeepTimeout: 60,
//     WrongCodeLockDuration: 120,
//     HoldCodeValidationAccOff: 120,
//     WrongCodeCountBeforeLock: 5,
//     buzzerRateWrongCode: 5,
//     DriverCodes: []
//   }
// };

// // router.post('/update_driver_codes', verifyToken, async (req, res) => {
// //     try {
// //         const { IMEI, VersionId, Data, DriverCodes } = req.body;

// //         if (!IMEI ||  (!Data && !DriverCodes )|| !VersionId) {
// //             return res.status(400).json({ error: 'Invalid request. IMEI and either Data or DriverCodes are required.' });
// //         }

// //         const MGServiceConfig = await getMGServiceConfigModel(); // Telematics DB
// //         const NFCConfig = await getNFCConfigModel(); // MGVisionAPI DB
// //         if (!MGServiceConfig || !NFCConfig) {
// //             return res.status(500).json({ error: 'Database models are not initialized.' });
// //         }
// //         const telematicsUpdateFields = {};
// //         if (Data) {
// //             if (Data.DriverCodeSettings) {
// //                 telematicsUpdateFields['Data.DriverCodeSettings'] = { 
// //                     ...defaultDataTelematics.Data.DriverCodeSettings, 
// //                     ...Data.DriverCodeSettings 
// //                 };
// //             }
// //             Object.keys(Data).forEach(key => {
// //                 if (key !== 'DriverCodes' && key !== 'DriverCodeSettings') {
// //                     telematicsUpdateFields[`Data.${key}`] = Data[key];
// //                 }
// //             });
// //         }

// //         const telematicsUpdate = await MGServiceConfig.findOneAndUpdate(
// //             { IMEI },
// //             {
// //                 $set: {
// //                     ...telematicsUpdateFields,
// //                     VersionId, // Update VersionId
// //                 },
// //                 $setOnInsert: { ...defaultDataTelematics }, // Use defaults for new records
// //             },
// //             { new: true, upsert: true }
// //         );

// //         if (DriverCodes && DriverCodes.length > 0) {
// //             await MGServiceConfig.findOneAndUpdate(
// //                 { IMEI },
// //                 { $addToSet: { 'Data.DriverCodes': { $each: DriverCodes } } },
// //                 { new: true }

// //             );
// //         }

// //         if (telematicsUpdate && telematicsUpdate.Data) {
// //             const md5HashTelematics = crypto.createHash('md5').update(JSON.stringify(telematicsUpdate.Data)).digest('hex');
// //             await MGServiceConfig.findByIdAndUpdate(telematicsUpdate._id, { md5: md5HashTelematics, VersionId 
// //                 });
// //         }
// //         const mgVisionApiUpdateFields = {};
// //         if (Data) {
// //             mgVisionApiUpdateFields['Data'] = {
// //                 ...defaultDataMGVisionAPI.Data,
// //                 ...Data
// //             };
// //         }

// //         const mgVisionApiUpdate = await NFCConfig.findOneAndUpdate(
// //             { IMEI },
// //             { $set:{ ...mgVisionApiUpdateFields,VersionId},
// //              $setOnInsert: defaultDataMGVisionAPI },
// //             { new: true, upsert: true }
// //         );

// //         if (DriverCodes && DriverCodes.length > 0) {
// //             mgVisionApiUpdate=  await NFCConfig.findOneAndUpdate(
// //                 { IMEI },
// //                 { $addToSet: { 'Data.DriverCodes': { $each: DriverCodes } } },
// //                 { new: true }

// //             );
// //         }

       

// //         if (mgVisionApiUpdate && mgVisionApiUpdate.Data) {
// //             const md5HashMGVisionAPI = crypto.createHash('md5').update(JSON.stringify(mgVisionApiUpdate.Data)).digest('hex');
// //             await NFCConfig.findByIdAndUpdate(mgVisionApiUpdate._id, { md5: md5HashMGVisionAPI });
// //         }

// //         res.status(200).json({
// //             data: {
// //                 IMEI,
// //                 VersionId
// //             }
// //         });

// //     } catch (error) {
// //         console.error('Error updating configurations:', error);
// //         res.status(500).json({ error: 'Internal Server Error' });
// //     }
// // });




// router.post('/update_driver_codes', verifyToken, async (req, res) => {
//     try {
//         const { IMEI, VersionId, Data, DriverCodes } = req.body;

//         if (!IMEI || (!Data && !DriverCodes) || !VersionId) {
//             return res.status(400).json({ error: 'Invalid request. IMEI, VersionId, and either Data or DriverCodes are required.' });
//         }

//         const MGServiceConfig = await getMGServiceConfigModel(); // Telematics DB
//         const NFCConfig = await getNFCConfigModel(); // MGVisionAPI DB

//         // **Update fields for Telematics DB**
//         const telematicsUpdateFields = {};
//         if (Data) {
//             if (Data.DriverCodeSettings) {
//                 telematicsUpdateFields['Data.DriverCodeSettings'] = { 
//                     ...defaultDataTelematics.Data.DriverCodeSettings, 
//                     ...Data.DriverCodeSettings 
//                 };
//             }
//             Object.keys(Data).forEach(key => {
//                 if (key !== 'DriverCodes' && key !== 'DriverCodeSettings') {
//                     telematicsUpdateFields[`Data.${key}`] = Data[key];
//                 }
//             });
//         }

//         const telematicsUpdate = await MGServiceConfig.findOneAndUpdate(
//             { IMEI },
//             { 
//                 $set: {
//                     ...telematicsUpdateFields,
//                     VersionId // Ensure VersionId is updated
//                 },
//                 $setOnInsert: { ...defaultDataTelematics }
//             },
//             { new: true, upsert: true }
//         );

//         if (DriverCodes && DriverCodes.length > 0) {
//             await MGServiceConfig.findOneAndUpdate(
//                 { IMEI },
//                 { $addToSet: { 'Data.DriverCodes': { $each: DriverCodes } } },
//                 { new: true }
//             );
//         }

//         if (telematicsUpdate && telematicsUpdate.Data) {
//             const md5HashTelematics = crypto.createHash('md5').update(JSON.stringify(telematicsUpdate.Data)).digest('hex');
//             await MGServiceConfig.findByIdAndUpdate(telematicsUpdate._id, { md5: md5HashTelematics });
//         }

//         // **Update fields for MGVisionAPI DB**
//         const mgVisionApiUpdateFields = {};
//         if (Data) {
//             mgVisionApiUpdateFields['Data'] = {
//                 ...defaultDataMGVisionAPI.Data,
//                 ...Data
//             };
//         }

//         const mgVisionApiUpdate = await NFCConfig.findOneAndUpdate(
//             { IMEI },
//             {
//                 $set: {
//                     ...mgVisionApiUpdateFields,
//                     VersionId // Ensure VersionId is updated
//                 },
//                 $setOnInsert: { ...defaultDataMGVisionAPI }
//             },
//             { new: true, upsert: true }
//         );

//         if (DriverCodes && DriverCodes.length > 0) {
//             await NFCConfig.findOneAndUpdate(
//                 { IMEI },
//                 { $addToSet: { 'Data.DriverCodes': { $each: DriverCodes } } }
//             );
//         }

//         // **Update md5 for MGVisionAPI**
//         if (mgVisionApiUpdate && mgVisionApiUpdate.Data) {
//             const md5HashMGVisionAPI = crypto.createHash('md5').update(JSON.stringify(mgVisionApiUpdate.Data)).digest('hex');
//             await NFCConfig.findByIdAndUpdate(
//                 mgVisionApiUpdate._id,
//                 { md5: md5HashMGVisionAPI, VersionId } // Save md5 and VersionId
//             );
//         }

//         res.status(200).json({
//             data: {
//                 IMEI,
//                 VersionId
//             }
//         });

//     } catch (error) {
//         console.error('Error updating configurations:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// module.exports = router;


const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const getMGServiceConfigModel = require('../models/mgServiceConfig'); // Telematics DB model
const getNFCConfigModel = require('../../MGVisionAPI/models/nfcCongig'); // MGVisionAPI DB model
const diffGeneral = require('../../MGVisionAPI/models/DiffGeneral'); // Change tracking model
const { verifyToken } = require("../token");

// Helper function for deep merging objects
const deepMerge = (target, source) => {
    for (const key in source) {
        if (
            source[key] &&
            typeof source[key] === 'object' &&
            !Array.isArray(source[key]) &&
            !(source[key] instanceof Date)
        ) {
            if (!target[key]) target[key] = {};
            deepMerge(target[key], source[key]);
        } else {
            if (!target[key]) target[key] = source[key];
        }
    }
};

// Function to compute differences between old and new data
const getDifferences = (oldData, newData) => {
    const changes = {};
    for (const key in newData) {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
            changes[key] = { old: oldData[key] || null, new: newData[key] || null };
        }
    }
    return changes;
};

// POST route to update DriverCodes
router.post('/update_driver_codes', verifyToken, async (req, res) => {
    try {
        const { IMEI, VersionId, Data, DriverCodes } = req.body;

        // Validate input
        if (!IMEI || (!Data && !DriverCodes) || !VersionId) {
            return res.status(400).json({ error: 'Invalid request. IMEI, VersionId, and either Data or DriverCodes are required.' });
        }

        const MGServiceConfig = await getMGServiceConfigModel(); // Telematics DB
        const NFCConfig = await getNFCConfigModel(); // MGVisionAPI DB

        if (!MGServiceConfig || !NFCConfig) {
            return res.status(500).json({ error: 'Database models are not initialized.' });
        }

        // Fetch default values from the database
        const defaultDoc = await MGServiceConfig.findOne({ IMEI: 'default' });
        if (!defaultDoc) {
            return res.status(500).json({ error: 'Default configuration not found in the database.' });
        }
        const defaultData = defaultDoc.Data;

        // Fetch old data for change tracking
        let oldTelematicsDoc = await MGServiceConfig.findOne({ IMEI });
        let oldNfcDoc = await NFCConfig.findOne({ IMEI });

        const oldDataTelematics = oldTelematicsDoc ? JSON.parse(JSON.stringify(oldTelematicsDoc.Data)) : {};
        const oldDataNFC = oldNfcDoc ? JSON.parse(JSON.stringify(oldNfcDoc.Data)) : {};

        let newTelematicsDoc, newNfcDoc;

        // **Update or Create in Telematics DB**
        if (!oldTelematicsDoc) {
            const newData = {
                IMEI,
                ConfigID: defaultDoc.ConfigID,
                Data: JSON.parse(JSON.stringify(defaultData)), // Clone default
                VersionId,
            };

            if (Data) deepMerge(newData.Data, Data);
            if (DriverCodes) newData.Data.DriverCodes = DriverCodes;

            newTelematicsDoc = new MGServiceConfig(newData);
            await newTelematicsDoc.save();
        } else {
            const updateFields = {};
            if (Data) {
                Object.keys(Data).forEach((key) => {
                    updateFields[`Data.${key}`] = Data[key];
                });
            }
            if (DriverCodes) {
                updateFields['Data.DriverCodes'] = DriverCodes;
            }
            updateFields.VersionId = VersionId;

            newTelematicsDoc = await MGServiceConfig.findOneAndUpdate(
                { IMEI },
                { $set: updateFields },
                { new: true }
            );
        }

        // **Update or Create in MGVisionAPI DB**
        if (!oldNfcDoc) {
            const newData = {
                IMEI,
                Data: JSON.parse(JSON.stringify(defaultData)), // Clone default
                VersionId,
            };

            if (Data) deepMerge(newData.Data, Data);
            if (DriverCodes) newData.Data.DriverCodes = DriverCodes;

            newNfcDoc = new NFCConfig(newData);
            await newNfcDoc.save();
        } else {
            const updateFields = {};
            if (Data) {
                Object.keys(Data).forEach((key) => {
                    updateFields[`Data.${key}`] = Data[key];
                });
            }
            if (DriverCodes) {
                updateFields['Data.DriverCodes'] = DriverCodes;
            }
            updateFields.VersionId = VersionId;

            newNfcDoc = await NFCConfig.findOneAndUpdate(
                { IMEI },
                { $set: updateFields },
                { new: true }
            );
        }

        // **Compute and Save Changes**
        const newDataTelematics = newTelematicsDoc.Data;
        const newDataNFC = newNfcDoc.Data;

        const changesTelematics = getDifferences(oldDataTelematics, newDataTelematics);
        const changesNFC = getDifferences(oldDataNFC, newDataNFC);

        if (Object.keys(changesTelematics).length > 0 || Object.keys(changesNFC).length > 0) {
            await diffGeneral.create({
                IMEI,
                OldData: { MGServiceConfig: oldDataTelematics, NFCConfig: oldDataNFC },
                NewData: { MGServiceConfig: newDataTelematics, NFCConfig: newDataNFC },
                Changes: { MGServiceConfig: changesTelematics, NFCConfig: changesNFC },
                Timestamp: new Date()
            });
        }

        res.status(200).json({ data: { IMEI, VersionId } });

    } catch (error) {
        console.error('Error updating configurations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
