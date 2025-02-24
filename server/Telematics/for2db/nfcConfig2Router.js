// // const express = require('express');
// // const crypto = require('crypto');
// // const router = express.Router();
// // const getMGServiceConfigModel = require('../models/mgServiceConfig'); // Model for Telematics DB
// // const getNFCConfigModel = require("../../MGVisionAPI/models/nfcCongig"); // Model for MGVisionAPI DB
// // const { verifyToken } = require("../token");

// // // Full default structure for the old configuration in Telematics DB
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

// // Full default structure for the new configuration in MGVisionAPI DB
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

// // // POST route to update configurations in both Telematics and MGVisionAPI DBs
// // router.post('/update_config', verifyToken, async (req, res) => {
// //     try {
// //         const { IMEI, VersionId, Data } = req.body;

// //         // Validate required fields
// //         if (!IMEI || !VersionId || !Data || typeof Data !== 'object') {
// //             return res.status(400).json({ error: 'Invalid request. IMEI, VersionId, and Data are required.' });
// //         }

// //         // Initialize both models
// //         const MGServiceConfig = await getMGServiceConfigModel(); // Telematics DB
// //         const NFCConfig = await getNFCConfigModel(); // MGVisionAPI DB

// //         if (!MGServiceConfig || !NFCConfig) {
// //             return res.status(500).json({ error: 'Models for one or both databases are not initialized.' });
// //         }

// //         // **Step 1: Update Telematics DB (Old Structure) - Non-array Fields**
// //         const { DriverCodes, DriverCodeSettings, ...otherDataFields } = Data;

// //         // Update non-array fields except for DriverCodes and DriverCodeSettings to avoid conflicts
// //         const telematicsUpdateFields = {
// //             VersionId,
// //             ...Object.keys(otherDataFields).reduce((acc, key) => ({ ...acc, [`Data.${key}`]: Data[key] }), {})
// //         };

// //         const telematicsUpdate = await MGServiceConfig.findOneAndUpdate(
// //             { IMEI },
// //             { $set: telematicsUpdateFields, $setOnInsert: defaultDataTelematics },
// //             { new: true, upsert: true }
// //         );

// //         // Update DriverCodeSettings separately
// //         if (DriverCodeSettings) {
// //             await MGServiceConfig.findOneAndUpdate(
// //                 { IMEI },
// //                 { $set: { 'Data.DriverCodeSettings': { ...defaultDataTelematics.Data.DriverCodeSettings, ...DriverCodeSettings } } }
// //             );
// //         }

// //         // **Step 2: Add to DriverCodes Array in Telematics DB Separately**
// //         if (DriverCodes && DriverCodes.length > 0) {
// //             await MGServiceConfig.findOneAndUpdate(
// //                 { IMEI },
// //                 { $addToSet: { 'Data.DriverCodes': { $each: DriverCodes } } }
// //             );
// //         }

// //         // **Update MGVisionAPI DB (New Structure) - Non-array Fields**
// //         const mgVisionApiUpdateFields = {
// //             ...defaultDataMGVisionAPI.Data,
// //             ...otherDataFields
// //         };

// //         const mgVisionApiUpdate = await NFCConfig.findOneAndUpdate(
// //             { IMEI },
// //             { $set: mgVisionApiUpdateFields },
// //             { new: true, upsert: true }
// //         );

// //         // **Add to DriverCodes Array in MGVisionAPI DB Separately**
// //         if (DriverCodes && DriverCodes.length > 0) {
// //             await NFCConfig.findOneAndUpdate(
// //                 { IMEI },
// //                 { $addToSet: { 'Data.DriverCodes': { $each: DriverCodes } } }
// //             );
// //         }

// //         // **Calculate and Update MD5 Hashes for Both DBs**
// //         const md5HashTelematics = crypto.createHash('md5').update(JSON.stringify(telematicsUpdate.Data)).digest('hex');
// //         const md5HashMGVisionAPI = crypto.createHash('md5').update(JSON.stringify(mgVisionApiUpdate.Data)).digest('hex');

// //         await Promise.all([
// //             MGServiceConfig.findByIdAndUpdate(telematicsUpdate._id, { DataMd5: md5HashTelematics }),
// //             NFCConfig.findByIdAndUpdate(mgVisionApiUpdate._id, { md5: md5HashMGVisionAPI })
// //         ]);

// //         // **Respond with IMEI and VersionId**
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

// // module.exports = router;



// const express = require('express');
// const crypto = require('crypto');
// const router = express.Router();
// const getMGServiceConfigModel = require('../models/mgServiceConfig'); // Model for Telematics DB
// const getNFCConfigModel = require("../../MGVisionAPI/models/nfcCongig"); // Model for MGVisionAPI DB
// const { verifyToken } = require("../token");

// router.post('/update_config', verifyToken, async (req, res) => {
//     try {
//         const { IMEI, VersionId, Data, DriverCodes } = req.body;

//         if (!IMEI || !VersionId || (!Data && !DriverCodes)) {
//             return res.status(400).json({ error: 'Invalid request. IMEI, VersionId, and either Data or DriverCodes are required.' });
//         }

//         const MGServiceConfig = await getMGServiceConfigModel(); // Telematics DB
//         const NFCConfig = await getNFCConfigModel(); // MGVisionAPI DB

//         const telematicsUpdateFields = { VersionId };
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
//             { $set: telematicsUpdateFields, $setOnInsert: defaultDataTelematics },
//             { new: true, upsert: true }
//         );

//         if (DriverCodes && DriverCodes.length > 0) {
//             await MGServiceConfig.findOneAndUpdate(
//                 { IMEI },
//                 { $addToSet: { 'Data.DriverCodes': { $each: DriverCodes } } }
//             );
//         }

//         const mgVisionApiUpdateFields = { VersionId };
//         if (Data) {
//             mgVisionApiUpdateFields['Data'] = {
//                 ...defaultDataMGVisionAPI.Data,
//                 ...Data
//             };
//         }

//         const mgVisionApiUpdate = await NFCConfig.findOneAndUpdate(
//             { IMEI },
//             { $set: mgVisionApiUpdateFields, $setOnInsert: defaultDataMGVisionAPI },
//             { new: true, upsert: true }
//         );

//         if (DriverCodes && DriverCodes.length > 0) {
//             await NFCConfig.findOneAndUpdate(
//                 { IMEI },
//                 { $addToSet: { 'Data.DriverCodes': { $each: DriverCodes } } }
//             );
//         }

//         if (telematicsUpdate && telematicsUpdate.Data) {
//             const md5HashTelematics = crypto.createHash('md5').update(JSON.stringify(telematicsUpdate.Data)).digest('hex');
//             await MGServiceConfig.findByIdAndUpdate(telematicsUpdate._id, { DataMd5: md5HashTelematics });
//         }

//         if (mgVisionApiUpdate && mgVisionApiUpdate.Data) {
//             const md5HashMGVisionAPI = crypto.createHash('md5').update(JSON.stringify(mgVisionApiUpdate.Data)).digest('hex');
//             await NFCConfig.findByIdAndUpdate(mgVisionApiUpdate._id, { md5: md5HashMGVisionAPI });
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

// router.post('/update_config', verifyToken, async (req, res) => {
//     try {
//         const { IMEI, VersionId, Data, DriverCodes } = req.body;

//         if (!IMEI || (!Data && !DriverCodes)) {
//             return res.status(400).json({ error: 'Invalid request. IMEI and either Data or DriverCodes are required.' });
//         }

//         const MGServiceConfig = await getMGServiceConfigModel(); // Telematics DB
//         const NFCConfig = await getNFCConfigModel(); // MGVisionAPI DB

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
//             { $set: telematicsUpdateFields, $setOnInsert: defaultDataTelematics },
//             { new: true, upsert: true }
//         );

//         if (DriverCodes && DriverCodes.length > 0) {
//             await MGServiceConfig.findOneAndUpdate(
//                 { IMEI },
//                 { $addToSet: { 'Data.DriverCodes': { $each: DriverCodes } } }
//             );
//         }

//         const mgVisionApiUpdateFields = {};
//         if (Data) {
//             mgVisionApiUpdateFields['Data'] = {
//                 ...defaultDataMGVisionAPI.Data,
//                 ...Data
//             };
//         }

//         const mgVisionApiUpdate = await NFCConfig.findOneAndUpdate(
//             { IMEI },
//             { $set: mgVisionApiUpdateFields, $setOnInsert: defaultDataMGVisionAPI },
//             { new: true, upsert: true }
//         );

//         if (DriverCodes && DriverCodes.length > 0) {
//             await NFCConfig.findOneAndUpdate(
//                 { IMEI },
//                 { $addToSet: { 'Data.DriverCodes': { $each: DriverCodes } } }
//             );
//         }

//         if (telematicsUpdate && telematicsUpdate.Data) {
//             const md5HashTelematics = crypto.createHash('md5').update(JSON.stringify(telematicsUpdate.Data)).digest('hex');
//             await MGServiceConfig.findByIdAndUpdate(telematicsUpdate._id, { DataMd5: md5HashTelematics });
//         }

//         if (mgVisionApiUpdate && mgVisionApiUpdate.Data) {
//             const md5HashMGVisionAPI = crypto.createHash('md5').update(JSON.stringify(mgVisionApiUpdate.Data)).digest('hex');
//             await NFCConfig.findByIdAndUpdate(mgVisionApiUpdate._id, { md5: md5HashMGVisionAPI });
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
const getMGServiceConfigModel = require('../models/mgServiceConfig'); // Model for Telematics DB
const getGeneralConfigModel = require('../../MGVisionAPI/models/generalConfig'); // Model for MGVisionAPI DB
const { verifyToken } = require("../token");

// Default structures
const defaultDataTelematics = {
  ConfigID: "01",
  Data: {
    GPS: { SendGpsAccOn: 5, SendGpsAccOff: 3600, GpsAzimuth: 30, SendGpsIdle: 120, SendGpsAccumulateDistance: 150, BackupBatteryX: 1800, BackupBatteryFirstX: 60, BackupBatteryAfterX: 1800 },
    Temperature: { FrontSensorMac: "", RearSensorMac: "", SendTempRateAccOn: 5, SendTempRateAccOff: 10 },
    TirePressure: { SendTireRateAccOn: 0, SendTireRateAccOff: 0 },
    CAN: { Type: "J1939", Baudrate: 500, Lock: 0, EnQuery: 1 },
    DriverCodeSettings: { Type: "", Style: "allCodeOK", BeepTimeout: 240, WrongCodeLockDuration: 240 },
    DriverCodes: ["1325"],
    EventsSettings: { '164': { active: 1 }, '261': { active: 1 } },
    ActiveModules: { keypad: 0, NFC: 1, Gsensore: 1 },
    CalibrationCommands: { OdometerValue: 0, WarmStart: 0 },
    PowerOffSetting: { PowerOffDelayDefault: 7200 }
  }
};

const defaultDataMGVisionAPI = {
  Data: {
    Style: "allCodeOK",
    BeepTimeout: 60,
    WrongCodeLockDuration: 120,
    HoldCodeValidationAccOff: 120,
    WrongCodeCountBeforeLock: 5,
    buzzerRateWrongCode: 5,
    DriverCodes: []
  }
};

// POST route to update configurations in both Telematics and MGVisionAPI DBs
router.post('/update_config', verifyToken, async (req, res) => {
    try {
        const { IMEI, VersionId, Data } = req.body;

        // Validate required fields
        if (!IMEI || !Data || typeof Data !== 'object') {
            return res.status(400).json({ error: 'Invalid request. IMEI and Data are required.' });
        }

        const MGServiceConfig = await getMGServiceConfigModel(); // Telematics DB
        const GeneralConfig = await getGeneralConfigModel(); // MGVisionAPI DB

        // **Step 1: Update MGVisionAPI DB (New Structure)**
        const mgVisionApiData = { Data: { ...defaultDataMGVisionAPI.Data, ...Data } };

        const mgVisionApiUpdate = await GeneralConfig.findOneAndUpdate(
            { IMEI },
            { $set: mgVisionApiData },
            { new: true, upsert: true }
        );

        // **Step 2: Map Data to Telematics DB Structure and Update**
        const telematicsData = {};
        if (Data) {
            if (Data.GPS) telematicsData['Data.GPS'] = { ...defaultDataTelematics.Data.GPS, ...Data.GPS };
            if (Data.Temperature) telematicsData['Data.Temperature'] = { ...defaultDataTelematics.Data.Temperature, ...Data.Temperature };
            if (Data.TirePressure) telematicsData['Data.TirePressure'] = { ...defaultDataTelematics.Data.TirePressure, ...Data.TirePressure };
            if (Data.CAN) telematicsData['Data.CAN'] = { ...defaultDataTelematics.Data.CAN, ...Data.CAN };
            if (Data.DriverCodeSettings) telematicsData['Data.DriverCodeSettings'] = { ...defaultDataTelematics.Data.DriverCodeSettings, ...Data.DriverCodeSettings };
            if (Data.DriverCodes) telematicsData['Data.DriverCodes'] = Data.DriverCodes;
            if (Data.EventsSettings) telematicsData['Data.EventsSettings'] = { ...defaultDataTelematics.Data.EventsSettings, ...Data.EventsSettings };
            if (Data.ActiveModules) telematicsData['Data.ActiveModules'] = { ...defaultDataTelematics.Data.ActiveModules, ...Data.ActiveModules };
            if (Data.CalibrationCommands) telematicsData['Data.CalibrationCommands'] = { ...defaultDataTelematics.Data.CalibrationCommands, ...Data.CalibrationCommands };
            if (Data.PowerOffSetting) telematicsData['Data.PowerOffSetting'] = { ...defaultDataTelematics.Data.PowerOffSetting, ...Data.PowerOffSetting };
        }

        const telematicsUpdate = await MGServiceConfig.findOneAndUpdate(
            { IMEI },
            { $set: telematicsData },
            { new: true, upsert: true }
        );

        // **Calculate and Update MD5 Hashes for Both DBs**
        if (telematicsUpdate && telematicsUpdate.Data) {
            const md5HashTelematics = crypto.createHash('md5').update(JSON.stringify(telematicsUpdate.Data)).digest('hex');
            await MGServiceConfig.findByIdAndUpdate(telematicsUpdate._id, { DataMd5: md5HashTelematics });
        }

        if (mgVisionApiUpdate && mgVisionApiUpdate.Data) {
            const md5HashMGVisionAPI = crypto.createHash('md5').update(JSON.stringify(mgVisionApiUpdate.Data)).digest('hex');
            await GeneralConfig.findByIdAndUpdate(mgVisionApiUpdate._id, { md5: md5HashMGVisionAPI });
        }

        // **Respond with IMEI and VersionId**
        res.status(200).json({
            data: {
                IMEI,
                VersionId
            }
        });

    } catch (error) {
        console.error('Error updating general configuration:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;