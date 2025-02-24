const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const getThermalSensorModel = require("../models/thermalSensors");
const getGeneralConfigModel = require("../../MGVisionAPI/models/generalConfig");
const diffGeneral = require("../../MGVisionAPI/models/DiffGeneral");

const { verifyToken } = require("../token");

// Helper function to merge defaults with user-provided values
const mergeWithDefaults = (defaults, provided) => {
    const result = { ...defaults };
    for (const key in defaults) {
        result[key] = provided[key] !== undefined ? provided[key] : defaults[key];
    }
    return result;
};

const isValidMacAddress = (mac) => {
    const macRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
    return macRegex.test(mac);
};

const isValidUpdate = (update) => {
    const { imei, macList, VersionId } = update;
    return (
        typeof imei === "string" &&
        imei.trim() !== "" &&
        Array.isArray(macList) &&
        macList.length > 0 &&
        macList.every(isValidMacAddress) &&
        typeof VersionId === "string" &&
        VersionId.trim() !== ""
    );
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

// POST route to update thermal sensors
router.post('/thermal_sensor', verifyToken, async (req, res) => {
    try {
        const updates = req.body; // Expecting an array of { imei, macList, VersionId } objects
        console.log(updates);

        // Validate input
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ error: 'Invalid request. An array of IMEI and macList objects is required.' });
        }

        // Initialize models
        const ThermalSensor = await getThermalSensorModel();
        const GeneralConfig = await getGeneralConfigModel();

        if (!ThermalSensor || !GeneralConfig) {
            return res.status(500).json({ error: 'Database models are not initialized.' });
        }

        // Retrieve default configuration from GeneralConfig
        const defaultConfig = await GeneralConfig.findOne({ IMEI: "default" });
        if (!defaultConfig) {
            return res.status(500).json({ error: 'Default configuration (IMEI: "default") not found in GeneralConfig.' });
        }

        const defaultTemperature = defaultConfig.Data.Temperature;

        const results = [];

        // Process each update
        for (const update of updates) {
            try {
                if (!isValidUpdate(update)) {
                    results.push({ imei: update.imei || null, status: 'failed', error: 'Invalid data format.' });
                    continue;
                }

                const { imei, macList, VersionId } = update;

                // Fetch old records before making changes
                const oldThermalSensor = await ThermalSensor.findOne({ imei });
                const oldGeneralConfig = await GeneralConfig.findOne({ IMEI: imei });

                const oldDataThermal = oldThermalSensor ? JSON.parse(JSON.stringify(oldThermalSensor.macList)) : [];
                const oldDataGeneral = oldGeneralConfig ? JSON.parse(JSON.stringify(oldGeneralConfig.Data.Temperature)) : {};

                // Extract MAC addresses for GeneralConfig
                const frontSensorMac = macList[0] || defaultTemperature.FrontSensorMac; // Use default if missing
                const rearSensorMac = macList[1] || defaultTemperature.RearSensorMac;  // Use default if missing

                // Update ThermalSensor in Telematics DB
                const thermalSensorUpdates = {
                    macList, // Replace the entire macList to ensure only current MACs are saved
                    VersionId,
                };

                const updatedThermalSensor = await ThermalSensor.findOneAndUpdate(
                    { imei },
                    { $set: thermalSensorUpdates },
                    { new: true, upsert: true }
                );

                if (!updatedThermalSensor) {
                    results.push({ imei, status: 'failed', error: 'Failed to update ThermalSensor.' });
                    continue;
                }

                // Calculate MD5 hash for ThermalSensor
                const thermalSensorMd5 = crypto.createHash('md5').update(JSON.stringify(updatedThermalSensor.macList)).digest('hex');
                await ThermalSensor.findByIdAndUpdate(updatedThermalSensor._id, { md5: thermalSensorMd5 });

                // Update GeneralConfig in MGVisionAPI DB
                const generalConfigDoc = oldGeneralConfig || new GeneralConfig({ IMEI: imei, Data: defaultConfig.Data });

                // Merge defaults with provided values for Temperature
                const updatedTemperature = mergeWithDefaults(defaultTemperature, {
                    FrontSensorMac: frontSensorMac,
                    RearSensorMac: rearSensorMac,
                });

                generalConfigDoc.Data.Temperature = updatedTemperature;

                // Set VersionId and calculate MD5 for GeneralConfig
                generalConfigDoc.VersionId = VersionId;
                generalConfigDoc.md5 = crypto.createHash('md5').update(JSON.stringify(generalConfigDoc.Data)).digest('hex');
                await generalConfigDoc.save();

                // Save change tracking
                const newDataThermal = updatedThermalSensor.macList;
                const newDataGeneral = generalConfigDoc.Data.Temperature;

                const changesThermal = getDifferences(oldDataThermal, newDataThermal);
                const changesGeneral = getDifferences(oldDataGeneral, newDataGeneral);

                if (Object.keys(changesThermal).length > 0 || Object.keys(changesGeneral).length > 0) {
                    await diffGeneral.create({
                        IMEI: imei,
                        OldData: { ThermalSensor: oldDataThermal, GeneralConfig: oldDataGeneral },
                        NewData: { ThermalSensor: newDataThermal, GeneralConfig: newDataGeneral },
                        Changes: { ThermalSensor: changesThermal, GeneralConfig: changesGeneral },
                        Timestamp: new Date()
                    });
                }

                // Push the result of the update
                results.push({ imei, VersionId });
            } catch (innerError) {
                console.error(`Error processing update for IMEI ${update.imei}:`, innerError);
                results.push({ imei: update.imei || null, status: 'failed', error: 'Internal processing error.' });
            }
        }

        // Respond with the results
        res.status(200).json({ data: results });
    } catch (error) {
        console.error('Error updating thermal sensors:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
