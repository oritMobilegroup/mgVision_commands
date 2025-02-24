const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const getMGServiceConfigModel = require('../models/tirePressureConfig'); // Telematics DB model
const getGeneralConfigModel = require('../../MGVisionAPI/models/generalConfig'); // MGVisionAPI DB model
const { verifyToken } = require('../token');

// POST route to update TirePressure in both DBs
router.post('/update_tire_pressure', verifyToken, async (req, res) => {
    try {
        const updates = req.body; // Expecting an array of { imei, TirePressure, VersionId } objects

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ error: 'Invalid request. An array of IMEI and TirePressure objects is required.' });
        }

        const TirePressureConfig = await getMGServiceConfigModel();
        const GeneralConfig = await getGeneralConfigModel();

        if (!TirePressureConfig || !GeneralConfig) {
            return res.status(500).json({ error: 'Database models are not initialized.' });
        }

        const defaultConfig = await GeneralConfig.findOne({ IMEI: "default" });
        if (!defaultConfig) {
            return res.status(500).json({ error: 'Default configuration (IMEI: "default") not found in GeneralConfig.' });
        }

        const results = [];

        for (const update of updates) {
            const { imei, TirePressure, VersionId } = update;

            if (!imei || !TirePressure || !VersionId) {
                results.push({ imei, status: 'failed', error: 'Invalid data. IMEI, TirePressure, and VersionId are required.' });
                continue;
            }

            // **Update or Create in Telematics DB**
            const telematicsUpdate = await TirePressureConfig.findOneAndUpdate(
                { imei },
                { $set: { TirePressure, VersionId } },
                { new: true, upsert: true }
            );

            if (!telematicsUpdate) {
                results.push({ imei, status: 'failed', error: 'Failed to update TirePressureConfig.' });
                continue;
            }

            const telematicsMd5 = crypto.createHash('md5').update(JSON.stringify(telematicsUpdate.TirePressure)).digest('hex');
            await TirePressureConfig.findByIdAndUpdate(telematicsUpdate._id, { md5: telematicsMd5 });

            // **Update or Create in GeneralConfig DB**
            const generalConfigDoc = await GeneralConfig.findOne({ IMEI: imei }) || new GeneralConfig({
                IMEI: imei,
                Data: defaultConfig.Data,
            });

            // Completely overwrite the TirePressure section
            generalConfigDoc.Data.TirePressure = { ...TirePressure };
            generalConfigDoc.VersionId = VersionId;

            const generalConfigMd5 = crypto.createHash('md5').update(JSON.stringify(generalConfigDoc.Data)).digest('hex');
            generalConfigDoc.md5 = generalConfigMd5;

            await generalConfigDoc.save();

            results.push({ imei, VersionId });
        }

        res.status(200).json({ data: results });
    } catch (error) {
        console.error('Error updating configurations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
