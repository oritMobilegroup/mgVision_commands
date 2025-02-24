// //update the only DB mgvisionApi

// // const express = require('express');
// // const crypto = require('crypto');
// // const router = express.Router();
// // const getGeneralConfigModel = require('../models/generalConfig'); // Adjust the path as necessary
// // const { verifyToken, currentToken } = require("../token"); // Assuming you use token-based authentication

// // // POST route to add or update general configuration
// // router.post('/update_general_config', verifyToken, async (req, res) => {
// //     try {
// //         const { IMEI, VersionId, Data } = req.body;

// //         // Validate required fields
// //         if (!IMEI || !VersionId || !Data || typeof Data !== 'object') {
// //             return res.status(400).json({ error: 'Invalid request. IMEI, VersionId, and Data are required.' });
// //         }

// //         // Initialize and get the GeneralConfig model
// //         const GeneralConfig = await getGeneralConfigModel();

// //         if (!GeneralConfig) {
// //             return res.status(500).json({ error: 'GeneralConfig model is not initialized.' });
// //         }

// //         // Calculate the md5 hash for the Data field for tracking changes
// //         const md5Hash = crypto.createHash('md5').update(JSON.stringify(Data)).digest('hex');

// //         // Check if the document with the specified IMEI exists
// //         let config = await GeneralConfig.findOne({ IMEI });

// //         if (!config) {
// //             // Create a new document with a default structure if IMEI does not exist
// //             config = await GeneralConfig.create({
// //                 IMEI,
// //                 Data: Data,
// //                 md5: md5Hash
// //             });
// //         } else {
// //             // Update the Data and md5 fields in the existing document
// //             config = await GeneralConfig.findOneAndUpdate(
// //                 { IMEI },
// //                 { $set: { Data: Data, md5: md5Hash } },
// //                 { new: true }
// //             );
// //         }

// //         // Return IMEI and VersionId in the response
// //         res.status(200).json({
// //             data: {
// //                 IMEI: config.IMEI,
// //                 VersionId // Return the VersionId from the request, not from the database
// //             }
// //         });

// //     } catch (error) {
// //         console.error('Error updating general configuration:', error);
// //         res.status(500).json({ error: 'Internal Server Error' });
// //     }
// // });

// // module.exports = router;
  
// //this is update 2 db

// const express = require('express');
// const crypto = require('crypto');
// const router = express.Router();
// const getMGServiceConfigModel = require('../models/generalConfig'); // Model for Telematics DB
// const getGeneralConfigModel = require('../../Telematics/models/mgServiceConfig'); // Model for MGVisionAPI DB
// const { verifyToken } = require("../token");

// // Default structures
// const defaultDataTelematics = {
//   ConfigID: "01",
//   Data: {
//     GPS: { SendGpsAccOn: 5, SendGpsAccOff: 3600, GpsAzimuth: 30, SendGpsIdle: 120, SendGpsAccumulateDistance: 150, BackupBatteryX: 1800, BackupBatteryFirstX: 60, BackupBatteryAfterX: 1800 },
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

// // POST route to update configurations in both Telematics and MGVisionAPI DBs
// router.post('/update_general_config', verifyToken, async (req, res) => {
//     try {
//         const { IMEI, VersionId, Data } = req.body;
//         console.log(req.body);

//         // Validate required fields
//         if (!IMEI || !Data || !VersionId|| typeof Data !== 'object') {
//             return res.status(400).json({ error: 'Invalid request. IMEI and Data are required.' });
//         }

//         const MGServiceConfig = await getMGServiceConfigModel(); // Telematics DB
//         const GeneralConfig = await getGeneralConfigModel(); // MGVisionAPI DB

//         // **Step 1: Update MGVisionAPI DB (New Structure)**
//         const mgVisionApiData = { Data: { ...defaultDataMGVisionAPI.Data, ...Data } ,VersionId };

//         const mgVisionApiUpdate = await GeneralConfig.findOneAndUpdate(
//             { IMEI },
//             { $set: mgVisionApiData },
//             { new: true, upsert: true }
//         );

//         // **Step 2: Map Data to Telematics DB Structure and Update**
//         const telematicsData = {};
//         if (Data) {
//             if (Data.GPS) telematicsData['Data.GPS'] = { ...defaultDataTelematics.Data.GPS, ...Data.GPS };
//             if (Data.Temperature) telematicsData['Data.Temperature'] = { ...defaultDataTelematics.Data.Temperature, ...Data.Temperature };
//             if (Data.TirePressure) telematicsData['Data.TirePressure'] = { ...defaultDataTelematics.Data.TirePressure, ...Data.TirePressure };
//             if (Data.CAN) telematicsData['Data.CAN'] = { ...defaultDataTelematics.Data.CAN, ...Data.CAN };
//             if (Data.DriverCodeSettings) telematicsData['Data.DriverCodeSettings'] = { ...defaultDataTelematics.Data.DriverCodeSettings, ...Data.DriverCodeSettings };
//             if (Data.DriverCodes) telematicsData['Data.DriverCodes'] = Data.DriverCodes;
//             if (Data.EventsSettings) telematicsData['Data.EventsSettings'] = { ...defaultDataTelematics.Data.EventsSettings, ...Data.EventsSettings };
//             if (Data.ActiveModules) telematicsData['Data.ActiveModules'] = { ...defaultDataTelematics.Data.ActiveModules, ...Data.ActiveModules };
//             if (Data.CalibrationCommands) telematicsData['Data.CalibrationCommands'] = { ...defaultDataTelematics.Data.CalibrationCommands, ...Data.CalibrationCommands };
//             if (Data.PowerOffSetting) telematicsData['Data.PowerOffSetting'] = { ...defaultDataTelematics.Data.PowerOffSetting, ...Data.PowerOffSetting };
//         }

//         const telematicsUpdate = await MGServiceConfig.findOneAndUpdate(
//             { IMEI },
//             { $set: telematicsData },
//             { new: true, upsert: true }
//         );

//         // **Calculate and Update MD5 Hashes for Both DBs**
//         if (telematicsUpdate && telematicsUpdate.Data) {
//             const md5HashTelematics = crypto.createHash('md5').update(JSON.stringify(telematicsUpdate.Data)).digest('hex');
//             await MGServiceConfig.findByIdAndUpdate(telematicsUpdate._id, { DataMd5: md5HashTelematics });
//         }

//         if (mgVisionApiUpdate && mgVisionApiUpdate.Data) {
//             const md5HashMGVisionAPI = crypto.createHash('md5').update(JSON.stringify(mgVisionApiUpdate.Data)).digest('hex');
//             await GeneralConfig.findByIdAndUpdate(mgVisionApiUpdate._id, { md5: md5HashMGVisionAPI });
//         }

//         // **Respond with IMEI and VersionId**
//         res.status(200).json({
//             data: {
//                 IMEI,
//                 VersionId
//             }
//         });

//     } catch (error) {
//         console.error('Error updating general configuration:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// module.exports = router;
 
//this is update 2 db

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const getGeneralConfigModel = require('../models/generalConfig'); // MGVisionAPI Model
const getMGServiceConfigModel = require('../../Telematics/models/mgServiceConfig'); // Telematics Model
const getDiffGeneralModel = require('../models/DiffGeneral'); // Now properly initialized for MGVisionAPI

const { verifyToken } = require('../token');

// Default data structures
const defaultDataMGServiceConfig = { Data: { TirePressure: {}, GPS: {}, Temperature: {} } };
const defaultDataGeneralConfig = { Data: { TirePressure: {}, GPS: {}, Temperature: {} } };

// Utility function for deep merging
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
            target[key] = source[key];
        }
    }
};

// Function to get the differences between two objects
const getDifferences = (oldData, newData) => {
    const changes = {};
    for (const key in newData) {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
            changes[key] = { old: oldData[key] || null, new: newData[key] || null };
        }
    }
    return changes;
};

// POST route to update both databases
router.post('/update_general_config', verifyToken, async (req, res) => {
    try {
        const { IMEI, VersionId, Data } = req.body;
        console.log(` Received request to update IMEI: ${IMEI}`);

        // Validate required fields
        if (!IMEI || !VersionId || !Data || typeof Data !== 'object') {
            return res.status(400).json({ error: 'Invalid request. IMEI, VersionId, and Data are required.' });
        }

        // Initialize models
        const MGServiceConfig = await getMGServiceConfigModel();
        const GeneralConfig = await getGeneralConfigModel();
        const DiffGeneral = await getDiffGeneralModel(); // Get the correct model for change tracking

        if (!MGServiceConfig || !GeneralConfig) {
            return res.status(500).json({ error: 'Database models are not initialized.' });
        }

        // Fetch the existing unit data before making changes
        let oldConfigMGService = await MGServiceConfig.findOne({ IMEI });
        let oldConfigGeneral = await GeneralConfig.findOne({ IMEI });

        // Store deep copies of old data before updating
        const oldDataMGService = oldConfigMGService ? JSON.parse(JSON.stringify(oldConfigMGService.Data)) : {};
        const oldDataGeneral = oldConfigGeneral ? JSON.parse(JSON.stringify(oldConfigGeneral.Data)) : {};

        // Fetch or initialize documents
        let configMGService = oldConfigMGService || new MGServiceConfig({ IMEI, Data: { ...defaultDataMGServiceConfig.Data } });
        let configGeneral = oldConfigGeneral || new GeneralConfig({ IMEI, Data: { ...defaultDataGeneralConfig.Data } });

        // Ensure Data object exists before merging
        if (!configMGService.Data) configMGService.Data = {};
        if (!configGeneral.Data) configGeneral.Data = {};

        // **Step 1: Update `GeneralConfig` (MGVisionAPI)**
        if (Data.RecordingSettings) {
            if (!configGeneral.Data.RecordingSettings) configGeneral.Data.RecordingSettings = {};

            // Deep merge RecordingSettings
            for (const key in Data.RecordingSettings) {
                if (!configGeneral.Data.RecordingSettings[key]) {
                    configGeneral.Data.RecordingSettings[key] = Data.RecordingSettings[key];
                } else {
                    deepMerge(configGeneral.Data.RecordingSettings[key], Data.RecordingSettings[key]);
                }
            }
        }

        deepMerge(configGeneral.Data, Data); // Handle other fields
        configGeneral.VersionId = VersionId;
        configGeneral.md5 = crypto.createHash('md5').update(JSON.stringify(configGeneral.Data)).digest('hex');
        await configGeneral.save();

        // **Step 2: Update `MGServiceConfig` (Telematics DB)**
        deepMerge(configMGService.Data, Data); // Merge new data into existing
        configMGService.VersionId = VersionId;
        configMGService.md5 = crypto.createHash('md5').update(JSON.stringify(configMGService.Data)).digest('hex');
        await configMGService.save();

        // **Track changes: Save old and new data in diffGeneral collection**
        const newDataMGService = configMGService.Data;
        const newDataGeneral = configGeneral.Data;

        const changesMGService = getDifferences(oldDataMGService, newDataMGService);
        const changesGeneral = getDifferences(oldDataGeneral, newDataGeneral);

        if (Object.keys(changesMGService).length > 0 || Object.keys(changesGeneral).length > 0) {
            await DiffGeneral.create({
                IMEI,
                OldData: { MGServiceConfig: oldDataMGService, GeneralConfig: oldDataGeneral },
                NewData: { MGServiceConfig: newDataMGService, GeneralConfig: newDataGeneral },
                Changes: { MGServiceConfig: changesMGService, GeneralConfig: changesGeneral },
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
        console.error('Error updating configuration:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
